import json
import os
import tempfile

import gltest.direct.loader as direct_loader


CONTRACT = "contracts/TrustDSource.py"
GENVM_VERSION = "v0.2.12"


def _inject_message_to_fd0_windows_safe(vm):
    from genlayer.py import calldata
    from genlayer.py.types import Address

    sender_addr = vm.sender
    if isinstance(sender_addr, bytes):
        sender_addr = Address(sender_addr)

    contract_addr = vm._contract_address
    if isinstance(contract_addr, bytes):
        contract_addr = Address(contract_addr)

    origin_addr = vm.origin
    if isinstance(origin_addr, bytes):
        origin_addr = Address(origin_addr)

    message_data = {
        "contract_address": contract_addr,
        "sender_address": sender_addr,
        "origin_address": origin_addr,
        "stack": [],
        "value": vm._value,
        "datetime": vm._datetime,
        "is_init": False,
        "chain_id": vm._chain_id,
        "entry_kind": 0,
        "entry_data": b"",
        "entry_stage_data": None,
    }

    encoded = calldata.encode(message_data)
    fd, path = tempfile.mkstemp()
    os.write(fd, encoded)
    os.lseek(fd, 0, os.SEEK_SET)
    vm._original_stdin_fd = os.dup(0)
    vm._direct_test_stdin_path = path
    os.dup2(fd, 0)
    os.close(fd)


def test_contract_runs_under_genvm_and_blocks_replays(
    direct_vm,
    direct_deploy,
    monkeypatch,
):
    monkeypatch.setattr(
        direct_loader,
        "_inject_message_to_fd0",
        _inject_message_to_fd0_windows_safe,
    )
    contract = direct_deploy(CONTRACT, sdk_version=GENVM_VERSION)
    from genlayer.py.types import Address

    sender = str(Address(direct_vm.sender))

    unauthorized_report = contract.submit_content(
        "Mismatch sender",
        "https://example.com/mismatch",
        "This claim should not be accepted for another wallet.",
        "Mismatch wallet claim",
        "news",
        "0x0000000000000000000000000000000000000001",
    )
    assert unauthorized_report == ""

    report_id = contract.submit_content(
        "Authorized report",
        "https://example.com/report",
        "The city council approved a new public budget.",
        "The city council approved a public budget.",
        "news",
        sender,
    )
    assert report_id

    contract.extract_claims(report_id)
    contract.use_fallback_sources(report_id)
    contract.use_deterministic_credibility(report_id)

    first_report = json.loads(contract.calculate_credibility(report_id))
    second_report = json.loads(contract.calculate_credibility(report_id))
    assert first_report == second_report

    assert contract.store_report(report_id) is True
    analytics_after_first_store = json.loads(contract.get_analytics("all_time"))
    assert contract.store_report(report_id) is True
    analytics_after_second_store = json.loads(contract.get_analytics("all_time"))
    assert analytics_after_second_store == analytics_after_first_store

    first_score = int(contract.update_reputation(sender, report_id))
    profile_after_first_reward = json.loads(contract.get_profile(sender))
    second_score = int(contract.update_reputation(sender, report_id))
    profile_after_second_reward = json.loads(contract.get_profile(sender))

    assert second_score == first_score
    assert profile_after_second_reward == profile_after_first_reward

    other_wallet_score = int(
        contract.update_reputation(
            "0x0000000000000000000000000000000000000001",
            report_id,
        )
    )
    assert other_wallet_score == 0

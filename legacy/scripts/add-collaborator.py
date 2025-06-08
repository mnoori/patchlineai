#!/usr/bin/env python3
"""
Add a collaborator Bedrock agent (e.g. Legal Agent) to another agent (e.g. Gmail Agent).

Usage:
  python add-collaborator.py --parent-id C7VZ0QWDSG --collab-alias-arn arn:aws:bedrock:us-east-1:123456789012:agent-alias/LEGALALIAS1 --instruction "Please review the contract attachment and summarise key risks." --name LegalReview --relay TO_COLLABORATOR

The script wraps the Bedrock "PutAgentCollaborator" API (preview) so we can experiment locally without clicking in the console.
"""
import argparse
import json
import os
import time

import boto3
from botocore.exceptions import ClientError


def parse_args():
    parser = argparse.ArgumentParser(description="Add a collaborator agent to an existing Bedrock agent")
    parser.add_argument("--parent-id", required=True, help="Agent ID that will call the collaborator")
    parser.add_argument("--collab-alias-arn", required=True, help="Alias ARN of the collaborator agent")
    parser.add_argument("--instruction", required=True, help="Instruction describing what the collaborator should do")
    parser.add_argument("--name", required=True, help="Name of the collaborator block (e.g. LegalReview)")
    parser.add_argument("--relay", choices=["TO_COLLABORATOR", "DISABLED"], default="TO_COLLABORATOR", help="Whether to relay conversation history")
    parser.add_argument("--region", default=os.environ.get("AWS_REGION", "us-east-1"))
    return parser.parse_args()


def main():
    args = parse_args()

    client = boto3.client("bedrock-agent", region_name=args.region)

    payload = {
        "agentId": args.parent_id,
        "agentVersion": "DRAFT",
        "agentDescriptor": {"aliasArn": args.collab_alias_arn},
        "collaborationInstruction": args.instruction,
        "collaboratorName": args.name,
        "relayConversationHistory": args.relay,
        "clientToken": str(int(time.time() * 1000))
    }

    print("[INFO] Calling PutAgentCollaborator with payload:\n", json.dumps(payload, indent=2))

    try:
        resp = client.put_agent_collaborator(**payload)  # type: ignore
        print("[SUCCESS] Collaborator added:")
        print(json.dumps(resp, indent=2, default=str))
    except ClientError as e:
        print("[ERROR] Failed to add collaborator:", e.response.get("Error", {}))


if __name__ == "__main__":
    main() 
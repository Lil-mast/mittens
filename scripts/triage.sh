#!/bin/bash
export GOG_ACCOUNT=christiantazma77@gmail.com
export GOGCLI_KEYRING_BACKEND=file
export GOG_KEYRING_PASSWORD=mich77

EMAILS=$(gog gmail search 'newer_than:1d is:unread' --max 20 --json 2>/dev/null)

if [ -z "$EMAILS" ]; then
  curl -s -d "No new emails in the last 24h" ntfy.sh/taz-gmail-agent-x7k2
  exit 0
fi

MEETING=$(echo $EMAILS | grep -i "meeting\|zoom\|invite\|calendar" | wc -l)
SECURITY=$(echo $EMAILS | grep -i "alert\|security\|password\|login\|verify" | wc -l)
EVENT=$(echo $EMAILS | grep -i "event\|webinar\|conference\|ticket" | wc -l)
TOTAL=$(echo $EMAILS | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")

MSG="📬 Gmail Digest
Total unread: $TOTAL
🗓 Meetings: $MEETING
🔐 Security: $SECURITY
🎉 Events: $EVENT

Check dashboard for full breakdown."

curl -s \
  -H "Title: Gmail Agent Digest" \
  -H "Priority: high" \
  -H "Tags: email,inbox" \
  -d "$MSG" \
  ntfy.sh/taz-gmail-agent

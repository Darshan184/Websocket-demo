This is an Assignment demonstrating WebSocket implementation. The steps to be followed are
1. Use a tool like wscat
2. Paste this in the terminal(You can hardcode groupId as per your choice)---wscat -c "wss://fwfej372uk.execute-api.us-east-1.amazonaws.com/dev?groupId=room1"
3.Open another terminal instance
4.Paste the same command
5.Pass the json message as per the below template
```json
 {"action": "sendMessage", "groupId": "room1", "message": "Hello from User 1!"}
```
You will see the responses on both the terminals.

# Websocket Market Stream
# https://binance-docs.github.io/apidocs/futures/en/#websocket-market-streams

# websocket GitHub Link
# https://github.com/websocket-client/websocket-client

import websocket
import json


def on_open(ws):
	sub_msg = {"method": "SUBSCRIBE","params": ["!ticker@arr"],"id": 1}
	ws.send(json.dumps(sub_msg))
	print("Opened connection")


def on_message(ws, message):
    data = json.loads(message)
    # print(type(data))
    for x in data:
    	print(x['s'],x['c'])

url =  "wss://fstream.binance.com/ws"

ws = websocket.WebSocketApp(url,on_open=on_open,on_message=on_message)
ws.run_forever()

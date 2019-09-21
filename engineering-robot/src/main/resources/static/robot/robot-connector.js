class RobotConnector {

    constructor() {
        this._robotClient = null;
        this._signalingClient = null;

        this._webrtcConnector = new WebrtcConnector();
        this._webrtcConnector.onIceCandidate = this._onIceCandidate.bind(this);
        this._webrtcConnector.onCommand = this._processCommand.bind(this);
    }

    connect(address, port) {
        const robotSocket = new SockJS("/robot-internal-endpoint");
        const robotClient = Stomp.over(robotSocket);
        this._robotClient = robotClient;
        robotClient.connect({}, function (frame) {
            robotClient.subscribe('/browser/robot', this._processRobotMessage.bind(this))
        }.bind(this));

        const signalingEndpoint = encodeURI(`http://${address}:${port}/signaling-endpoint`);
        const signalingSocket = new SockJS(signalingEndpoint);
        const signalingClient = Stomp.over(signalingSocket);
        this._signalingClient = signalingClient;
        signalingClient.connect({}, function (frame) {
            signalingClient.subscribe('/browser/robot', this._processSignalingMessage.bind(this));
        }.bind(this));
    }

    _processRobotMessage(message) {
        this._webrtcConnector.sendCommand(message.body);
    }

    _processCommand(command) {
        this._robotClient.send("/internal/robot", {}, command);
    }

    _sendSignalingMessage(type, message) {
        this._signalingClient.send("/signaling/operator", {}, JSON.stringify({
            type: type,
            message: JSON.stringify(message)
        }));
    }

    async _processSignalingMessage(data) {
        let m = JSON.parse(data.body);
        switch (m.type) {
            case "MEDIA": {
                const offer = JSON.parse(m.message);
                this._webrtcConnector.close();
                this._webrtcConnector.open();
                const answer = await this._webrtcConnector.createAnswer(offer);
                this._sendSignalingMessage('MEDIA', answer);
                break;
            }
            case "ICE": {
                const ice = JSON.parse(m.message);
                await this._webrtcConnector.addIceCandidate(ice);
                break;
            }
            case "STOP": {
                this._webrtcConnector.close();
                break;
            }
        }
    }

    _onIceCandidate(candidate) {
        this._sendSignalingMessage("ICE", candidate);
    }
}
class OperatorConnector {

    constructor(onOpen, onClose, onRemoteTrack, onCommand) {
        const webrtcConnector = new WebrtcConnector();
        webrtcConnector.onChannelOpen = onOpen;
        webrtcConnector.onChannelClose = onClose;
        webrtcConnector.onTrack = onRemoteTrack;
        webrtcConnector.onCommand = onCommand;
        webrtcConnector.onIceCandidate = this._onIceCandidate.bind(this);

        this._webrtcConnector = webrtcConnector;
    }

    connect() {
        const socket = new SockJS('/signaling-endpoint');
        const signalingClient = Stomp.over(socket);
        this._signalingClient = signalingClient;

        signalingClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            signalingClient.subscribe('/browser/operator', this._processSignalingMessage.bind(this));
        }.bind(this));
    }

    async startWebrtcConnector() {
        this._webrtcConnector.close();
        this._webrtcConnector.open();
        const offer = await this._webrtcConnector.createOffer();
        this._sendSignalingMessage('MEDIA', offer);
    }

    stopWebrtcConnector() {
        this._webrtcConnector.close();
        this._sendSignalingMessage('STOP', '');
    }

    sendCommand(command) {
        this._webrtcConnector.sendCommand(command);
    }

    connected() {
        return this._webrtcConnector.isConnected;
    }

    _sendSignalingMessage(type, message) {
        this._signalingClient.send("/signaling/robot", {}, JSON.stringify({
            type: type,
            message: JSON.stringify(message)
        }));
    }

    async _processSignalingMessage(data) {
        let m = JSON.parse(data.body);
        switch (m.type) {
            case "MEDIA": {
                const answer = JSON.parse(m.message);
                await this._webrtcConnector.setRemoteDescription(answer);
                break;
            }
            case "ICE": {
                const ice = JSON.parse(m.message);
                await this._webrtcConnector.addIceCandidate(ice);
                break;
            }
        }
    }

    _onIceCandidate(candidate) {
        this._sendSignalingMessage("ICE", candidate);
    }
}
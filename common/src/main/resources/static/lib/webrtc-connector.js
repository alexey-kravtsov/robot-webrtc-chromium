class WebrtcConnector {

    _rtcConfiguration = {
        iceServers: [
            {urls: "stun:stun.services.mozilla.com"},
            {urls: "stun:stun.l.google.com:19302"}
        ]
    };

    _offerOptions = {
        offerToReceiveAudio: false,
        offerToReceiveVideo: true
    };

    constructor() {
        this._peerConnection = null;
        this._iceCandidates = null;
        this._commandChannel = null;
        this.isConnected = false;

        this.onIceCandidate = null;
        this.onTrack = null;
        this.onCommand = null;
        this.onChannelOpen = null;
        this.onChannelClose = null;
    }

    open() {
        this._getOrCreatePeerConnection();
    }

    async createOffer() {
        const peerConnection = this._getOrCreatePeerConnection();

        this._commandChannel = this._peerConnection.createDataChannel("commandChannel");

        if (this.onCommand != null) {
            this._commandChannel.addEventListener("message", this._handleCommand.bind(this));
            this._commandChannel.addEventListener("open", this._handleChannelOpen.bind(this));
            this._commandChannel.addEventListener("close", this._handleChannelClose.bind(this));
        }

        const offer = await peerConnection.createOffer(this._offerOptions);
        await peerConnection.setLocalDescription(offer);
        return offer;
    }

    async createAnswer(offer) {
        const desc = new RTCSessionDescription(offer);

        const peerConnection = this._getOrCreatePeerConnection();
        peerConnection.addEventListener('datachannel', this._handleDataChannel.bind(this));
        await peerConnection.setRemoteDescription(desc);
        const localStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                width: {min: 640, max: 640},
                height: {min: 480, max: 480},
                frameRate: {min: 30, max: 30}
            }
        });
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        await this._addQueuedCandidates();

        return answer;
    }

    async setRemoteDescription(description) {
        const desc = new RTCSessionDescription(description);

        const peerConnection = this._getOrCreatePeerConnection();
        await peerConnection.setRemoteDescription(desc);
        await this._addQueuedCandidates();
    }

    async addIceCandidate(ice) {
        const candidate = new RTCIceCandidate(ice);
        const peerConnection = this._getOrCreatePeerConnection();

        if (peerConnection.remoteDescription == null) {
            this._iceCandidates.push(candidate);
            return;
        }

        await this._addQueuedCandidates();
        await peerConnection.addIceCandidate(candidate);
    }

    sendCommand(command) {
        if (!this.isConnected) {
            console.error("Webrtc connection not established");
            return;
        }

        this._commandChannel.send(command);
    }

    close() {
        if (this._peerConnection != null) {
            this._peerConnection.close();
        }
        this._peerConnection = null;
        this._commandChannel = null;
        this._iceCandidates = null;
        this.isConnected = false;
    }

    _getOrCreatePeerConnection() {
        if (this._peerConnection == null) {
            console.log("Starting webrtc connector");

            this._iceCandidates = [];
            this._peerConnection = new RTCPeerConnection(this._rtcConfiguration);
            this._peerConnection.addEventListener('icecandidate', this._handleIceCandidate.bind(this));

            if (this.onTrack != null) {
                this._peerConnection.addEventListener('track', this.onTrack);
            }
        }

        return this._peerConnection;
    }

    _handleDataChannel(event) {
        this._commandChannel = event.channel;
        this._commandChannel.addEventListener("message", this._handleCommand.bind(this));
        this._commandChannel.addEventListener("open", this._handleChannelOpen.bind(this));
        this._commandChannel.addEventListener("close", this._handleChannelClose.bind(this));
    }

    async _addQueuedCandidates() {
        for (const queuedCandidate of this._iceCandidates) {
            await this._peerConnection.addIceCandidate(queuedCandidate);
        }
    }

    _handleIceCandidate(event) {
        if (event.candidate == null) {
            return;
        }

        this.onIceCandidate(event.candidate);
    }

    _handleCommand(event) {
        this.onCommand(event.data);
    }

    _handleChannelOpen(event) {
        this.isConnected = true;
        if (this.onChannelOpen != null) {
            this.onChannelOpen(event);
        }
    }

    _handleChannelClose(event) {
        this.isConnected = false;
        if (this.onChannelClose != null) {
            this.onChannelClose(event);
        }
    }
}
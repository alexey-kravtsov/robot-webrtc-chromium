let operatorConnector = null;
let movementController = null;

connectSignaling();
setupKeyListener();

function connectSignaling() {
    operatorConnector = new OperatorConnector(onChannelOpen, onChannelClose, onRemoteTrack, processCommand);
    operatorConnector.connect();
    movementController = new MovementController(operatorConnector);
}

function setupKeyListener() {
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyRelease);
}

function handleKeyPress(event) {
    movementController.keyPress(event.code);
}

function handleKeyRelease(event) {
    movementController.keyRelease(event.code);
}

async function start() {
    await operatorConnector.startWebrtcConnector();
}

function stop() {
    operatorConnector.stopWebrtcConnector();
}

function processCommand(event) {
    console.log(event);
}

function onRemoteTrack(event) {
    const $videoElement = $("#stream").get(0);
    const stream = event.streams[0];
    if ($videoElement.srcObject !== stream) {
        console.log('Incoming stream');
        $videoElement.srcObject = stream;
    }
}

function onChannelOpen(event) {
    console.log("Channel open");
}

function onChannelClose(event) {
    console.log("Channel close")
}
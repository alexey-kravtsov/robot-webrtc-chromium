let robotConnector = null;

function connect(address, port) {
    robotConnector = new RobotConnector();
    robotConnector.connect(address, port);
}
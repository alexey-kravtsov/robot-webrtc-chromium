let robotConnector = null;

function connect() {
    robotConnector = new RobotConnector();
    robotConnector.connect();
}

connect();
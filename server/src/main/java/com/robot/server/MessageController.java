package com.robot.server;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class MessageController {

    private Logger logger = LogManager.getLogger(MessageController.class);

    @MessageMapping("/signaling/robot")
    @SendTo("/browser/robot")
    public String sendToRobot(String message) {
        logger.info("Message time: " + System.currentTimeMillis());
        logger.info("Signaling received from operator: " + message);
        return message;
    }

    @MessageMapping("/signaling/operator")
    @SendTo("/browser/operator")
    public String sendToOperator(String message) {
        logger.info("Message time: " + System.currentTimeMillis());
        logger.info("Signaling received from robot: " + message);
        return message;
    }
}

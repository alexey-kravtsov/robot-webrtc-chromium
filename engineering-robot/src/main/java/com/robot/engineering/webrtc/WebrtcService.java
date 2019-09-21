package com.robot.engineering.webrtc;

import com.robot.engineering.serial.SerialCommunicator;
import jssc.SerialPortException;
import org.apache.commons.text.StringEscapeUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;
import org.springframework.util.StringUtils;

import java.io.IOException;

@Controller
public class WebrtcService {
    private static final Logger logger = LogManager.getLogger(WebrtcService.class);

    private final SimpMessageSendingOperations sender;
    private final SerialCommunicator serialCommunicator;

    @Value("${signaling.host}")
    private String host;

    @Value("${signaling.port:8080}")
    private int port;

    private ChromeDriver driver;

    @Autowired
    public WebrtcService(
            SimpMessageSendingOperations sender,
            SerialCommunicator communicator) {
        this.sender = sender;
        this.serialCommunicator = communicator;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("use-fake-ui-for-media-stream");
        //options.addArguments("headless");

        driver = new ChromeDriver(options);

        driver.get("http://localhost:9080/robot/index.html");

        String signalingHost = StringEscapeUtils.escapeEcmaScript(host);
        String script = String.format("connect(\'%s\', %s);", signalingHost, port);
        driver.executeScript(script);

        try {
            serialCommunicator.connect();
        } catch (SerialPortException e) {
            logger.error(e);
        }
    }

    @MessageMapping("/internal/robot")
    public void receiveFromBrowser(String message) {
        if (message.length() != 1 && message.length() != 4) {
            logger.error("Incorrect message: " + message);
            return;
        }

        byte headerSize = 4;
        byte serialMessageLength = (byte) (headerSize + message.length());
        byte[] serialMessage = new byte[serialMessageLength];
        serialMessage[0] = 0; // marker
        serialMessage[1] = serialMessageLength;
        serialMessage[2] = 1; // version
        serialMessage[3] = 'm'; // command type

        if (message.length() == 1) {
            serialMessage[4] = 'p';
        } else if (message.length() == 4) {
            serialMessage[4] = (byte)message.charAt(0);
            serialMessage[5] = (byte)message.charAt(1);
            serialMessage[6] = (byte)message.charAt(2);
            serialMessage[7] = (byte)(message.charAt(3) - 0x30);
        } else {
            logger.error("Incorrect message: " + message);
            return;
        }

        try {
            serialCommunicator.write(serialMessage);
        } catch (IOException e) {
            logger.error(e);
        }
    }

    public void sendToBrowser(String message) {
        sender.convertAndSend("/browser/robot", message);
    }
}

package com.robot.engineering;

import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

@Controller
public class WebrtcService {

    private final SimpMessageSendingOperations sender;

    private ChromeDriver driver;

    @Autowired
    public WebrtcService(SimpMessageSendingOperations sender) {
        this.sender = sender;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void startBrowser() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("use-fake-ui-for-media-stream");
        //options.addArguments("headless");

        driver = new ChromeDriver(options);

        driver.get("http://localhost:9080/robot/index.html");
    }

    @MessageMapping("/internal/robot")
    public void receiveFromBrowser(String message) {
        System.out.println(message);
    }

    public void sendToBrowser(String message) {
        sender.convertAndSend("/browser/robot", message);
    }
}

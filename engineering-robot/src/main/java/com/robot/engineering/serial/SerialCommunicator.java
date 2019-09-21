package com.robot.engineering.serial;

import jssc.SerialPort;
import jssc.SerialPortException;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class SerialCommunicator {

    private static final Logger logger = LogManager.getLogger(SerialCommunicator.class);

    private final String portName;
    private final Integer baudRate;
    private final Integer portOpenTimeoutMs;

    private SerialPort serialPort;

    public SerialCommunicator() {
        this.portName = "/dev/ttyACM0";
        this.baudRate = 115200;
        this.portOpenTimeoutMs = 3000;
    }

    public void connect() throws SerialPortException {
        serialPort = new SerialPort(portName);

        serialPort.openPort();

        serialPort.setParams(
                baudRate,
                SerialPort.DATABITS_8,
                SerialPort.STOPBITS_1,
                SerialPort.PARITY_NONE);

        serialPort.setFlowControlMode(
                SerialPort.FLOWCONTROL_RTSCTS_IN |
                        SerialPort.FLOWCONTROL_RTSCTS_OUT);

        try {
            Thread.sleep(portOpenTimeoutMs);
        } catch (InterruptedException e) {
            logger.error(e);
        }
    }

    public void disconnect() throws SerialPortException {
        if (serialPort != null) {
            serialPort.closePort();
        }
    }

    public void write(byte[] data) throws IOException {
        if (serialPort == null) {
            throw new IOException("Port not opened");
        }

        try {
            serialPort.writeBytes(data);
        } catch (SerialPortException e) {
            throw new IOException(e);
        }
    }

    public byte[] read() {
        return null;
    }
}

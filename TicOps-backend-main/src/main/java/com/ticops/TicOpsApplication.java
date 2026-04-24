package com.ticops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TicOpsApplication {
    public static void main(String[] args) {
        SpringApplication.run(TicOpsApplication.class, args);
    }
}

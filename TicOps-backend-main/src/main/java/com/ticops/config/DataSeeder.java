package com.ticops.config;

import com.ticops.entity.*;
import com.ticops.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final KbArticleRepository kbArticleRepository;
    private final IngestedEmailRepository ingestedEmailRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded — skipping.");
            return;
        }
        log.info("Seeding initial data...");
        seedUsers();
        seedCategories();
        seedKbArticles();
        seedIngestedEmails();
        log.info("Seeding complete.");
    }

    private void seedUsers() {
        String pwd = passwordEncoder.encode("password123");

        userRepository.saveAll(List.of(
            User.builder().name("Admin User").email("admin@ticops.com").password(pwd)
                    .role(UserRole.ADMIN).team("IT").build(),
            User.builder().name("Manager One").email("manager@ticops.com").password(pwd)
                    .role(UserRole.MANAGER).team("Support").build(),
            User.builder().name("Agent Smith").email("agent@ticops.com").password(pwd)
                    .role(UserRole.AGENT).team("Support").build(),
            User.builder().name("Agent Brown").email("agent2@ticops.com").password(pwd)
                    .role(UserRole.AGENT).team("Engineering").build(),
            User.builder().name("John Doe").email("john@company.com").password(pwd)
                    .role(UserRole.REQUESTOR).team("").build()
        ));
    }

    private void seedCategories() {
        categoryRepository.saveAll(List.of(
            Category.builder().name("Hardware").description("Hardware issues and requests").build(),
            Category.builder().name("Software").description("Software bugs and installations").build(),
            Category.builder().name("Network").description("Network connectivity and VPN").build(),
            Category.builder().name("Access").description("Account access and permissions").build(),
            Category.builder().name("General").description("General inquiries").build()
        ));
    }

    private void seedKbArticles() {
        Category software = categoryRepository.findAll().stream()
                .filter(c -> "Software".equals(c.getName())).findFirst().orElse(null);
        Category network = categoryRepository.findAll().stream()
                .filter(c -> "Network".equals(c.getName())).findFirst().orElse(null);
        Category access = categoryRepository.findAll().stream()
                .filter(c -> "Access".equals(c.getName())).findFirst().orElse(null);

        if (software != null) {
            kbArticleRepository.save(KbArticle.builder()
                    .category(software)
                    .title("How to Reset Your Password")
                    .body("Go to Settings > Security > Change Password. Enter your current password and then your new password twice. Click Save.")
                    .tags("password,reset,security")
                    .build());
            kbArticleRepository.save(KbArticle.builder()
                    .category(software)
                    .title("Installing Approved Software")
                    .body("Open the Software Center from Start menu. Browse or search for the application. Click Install and wait for completion.")
                    .tags("software,install,setup")
                    .build());
        }
        if (network != null) {
            kbArticleRepository.save(KbArticle.builder()
                    .category(network)
                    .title("VPN Connection Troubleshooting")
                    .body("1) Verify internet connectivity. 2) Restart the VPN client. 3) Check your credentials. 4) If the issue persists, contact the Network team.")
                    .tags("vpn,network,connectivity")
                    .build());
        }
        if (access != null) {
            kbArticleRepository.save(KbArticle.builder()
                    .category(access)
                    .title("Requesting Access to Shared Drives")
                    .body("Submit a ticket under the Access category. Include the drive path, your employee ID, and the level of access needed (read/write).")
                    .tags("access,drive,permissions")
                    .build());
        }
    }

    private void seedIngestedEmails() {
        Instant now = Instant.now();

        ingestedEmailRepository.saveAll(List.of(
            IngestedEmail.builder()
                .messageUid("msg-seed-001")
                .fromEmail("alice@external.com").fromName("Alice Johnson")
                .subject("Printer not working on 3rd floor")
                .bodyPreview("Hi Support, the printer on the 3rd floor (HP LaserJet 400) is not printing. It shows offline status even though it is powered on. We have tried restarting it but the issue persists. Please send someone to look at it.")
                .receivedAt(now.minus(2, ChronoUnit.HOURS)).processedAt(now.minus(2, ChronoUnit.HOURS))
                .status("PENDING").detectedPriority("MEDIUM")
                .build(),
            IngestedEmail.builder()
                .messageUid("msg-seed-002")
                .fromEmail("bob@partner.com").fromName("Bob Martinez")
                .subject("Urgent: Cannot access CRM system")
                .bodyPreview("Hello, I am unable to log into the CRM system since this morning. I get an error saying my account is locked. This is blocking all my client meetings today. Please resolve ASAP.")
                .receivedAt(now.minus(1, ChronoUnit.HOURS)).processedAt(now.minus(1, ChronoUnit.HOURS))
                .status("PENDING").detectedPriority("CRITICAL")
                .build(),
            IngestedEmail.builder()
                .messageUid("msg-seed-003")
                .fromEmail("carol@vendor.com").fromName("Carol White")
                .subject("Request for new monitor")
                .bodyPreview("Hi, I would like to request a second monitor for my desk. My current setup only has one 24-inch display and I need dual monitors for my development work. Please let me know the process.")
                .receivedAt(now.minus(30, ChronoUnit.MINUTES)).processedAt(now.minus(30, ChronoUnit.MINUTES))
                .status("PENDING").detectedPriority("LOW")
                .build(),
            IngestedEmail.builder()
                .messageUid("msg-seed-004")
                .fromEmail("dave@internal.com").fromName("Dave Chen")
                .subject("WiFi keeps dropping in Conference Room B")
                .bodyPreview("The WiFi in Conference Room B drops every 5-10 minutes during meetings. This has been happening for the past week and is disrupting client presentations. Multiple people have reported this issue.")
                .receivedAt(now.minus(15, ChronoUnit.MINUTES)).processedAt(now.minus(15, ChronoUnit.MINUTES))
                .status("PENDING").detectedPriority("HIGH")
                .build(),
            IngestedEmail.builder()
                .messageUid("msg-seed-005")
                .fromEmail("eve@company.com").fromName("Eve Williams")
                .subject("Software license renewal")
                .bodyPreview("Hi team, our Microsoft Office licenses expire next month. We need to renew for 50 seats. Can you please initiate the procurement process? Budget has been approved by finance.")
                .receivedAt(now.minus(5, ChronoUnit.MINUTES)).processedAt(now.minus(5, ChronoUnit.MINUTES))
                .status("PENDING").detectedPriority("MEDIUM")
                .build()
        ));
    }
}

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface OverdueReminderEmailProps {
  clientName: string;
  freelancerName: string;
  businessName: string | null;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  paymentLink: string;
  daysOverdue: number;
}

export const OverdueReminderEmail = ({
  clientName,
  freelancerName,
  businessName,
  invoiceNumber,
  amount,
  dueDate,
  paymentLink,
  daysOverdue,
}: OverdueReminderEmailProps) => {
  const senderName = businessName || freelancerName;

  return (
    <Html>
      <Head />
      <Preview>
        Invoice {invoiceNumber} is {String(daysOverdue)} days overdue
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>Paidly</Text>
          </Section>

          {/* Body */}
          <Section style={content}>
            {/* Warning Indicator */}
            <Text style={warningIcon}>⚠️</Text>

            <Heading style={headline}>
              Invoice {invoiceNumber} is {daysOverdue} days overdue
            </Heading>

            <Text style={paragraph}>
              This is a reminder that your invoice from{" "}
              <strong>{senderName}</strong> for <strong>{amount}</strong> was
              due on <strong>{dueDate}</strong>.
            </Text>

            {/* Details Box */}
            <Section style={summaryBox}>
              <Text style={summaryRow}>
                <Text style={summaryLabel}>Invoice Number</Text>
                <Text style={summaryValue}>{invoiceNumber}</Text>
              </Text>
              <Text style={summaryRow}>
                <Text style={summaryLabel}>Amount Due</Text>
                <Text style={summaryValue}>{amount}</Text>
              </Text>
              <Text style={summaryRow}>
                <Text style={summaryLabel}>Original Due Date</Text>
                <Text style={summaryValue}>{dueDate}</Text>
              </Text>
              <Text style={summaryRow}>
                <Text style={summaryLabel}>Days Overdue</Text>
                <Text style={summaryValueOverdue}>{daysOverdue} days</Text>
              </Text>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={paymentLink}>
                Pay Now →
              </Button>
            </Section>

            <Text style={linkText}>
              Or copy this link:{" "}
              <Link href={paymentLink} style={link}>
                {paymentLink}
              </Link>
            </Text>

            <Text style={politeNote}>
              If you've already made this payment, please disregard this email.
              If you have any questions or need to discuss payment arrangements,
              please reach out to {senderName} directly.
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Text style={footer}>
            This invoice was sent via Paidly ·{" "}
            <Link href="https://getpaidly.co" style={footerLink}>
              getpaidly.co
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "0",
  maxWidth: "600px",
};

const header = {
  backgroundColor: "#0f0f0f",
  padding: "32px 24px",
  textAlign: "center" as const,
};

const logo = {
  color: "#10b981",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0",
};

const content = {
  padding: "32px 24px",
  textAlign: "center" as const,
};

const warningIcon = {
  fontSize: "48px",
  margin: "0 0 16px 0",
};

const headline = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#f59e0b",
  margin: "0 0 16px 0",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#52525b",
  margin: "0 0 24px 0",
};

const summaryBox = {
  backgroundColor: "#fef3c7",
  padding: "20px",
  borderRadius: "8px",
  marginBottom: "24px",
  border: "1px solid #fbbf24",
};

const summaryRow = {
  margin: "0 0 12px 0",
  display: "flex",
  justifyContent: "space-between",
};

const summaryLabel = {
  fontSize: "14px",
  color: "#71717a",
  margin: "0",
};

const summaryValue = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#18181b",
  margin: "0",
};

const summaryValueOverdue = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#ef4444",
  margin: "0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const linkText = {
  fontSize: "14px",
  color: "#71717a",
  textAlign: "center" as const,
  margin: "16px 0 0 0",
};

const link = {
  color: "#10b981",
  textDecoration: "underline",
};

const politeNote = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#71717a",
  marginTop: "24px",
  fontStyle: "italic",
};

const divider = {
  borderColor: "#e4e4e7",
  margin: "0 24px",
};

const footer = {
  fontSize: "12px",
  color: "#a1a1aa",
  textAlign: "center" as const,
  padding: "16px 24px 32px",
  margin: "0",
};

const footerLink = {
  color: "#a1a1aa",
  textDecoration: "underline",
};

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

interface InvoiceEmailProps {
  clientName: string;
  freelancerName: string;
  businessName: string | null;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  paymentLink: string;
}

export const InvoiceEmail = ({
  clientName,
  freelancerName,
  businessName,
  invoiceNumber,
  amount,
  dueDate,
  paymentLink,
}: InvoiceEmailProps) => {
  const senderName = businessName || freelancerName;

  return (
    <Html>
      <Head />
      <Preview>
        Invoice {invoiceNumber} from {senderName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>Paidly</Text>
          </Section>

          {/* Body */}
          <Section style={content}>
            <Text style={greeting}>Hi {clientName},</Text>

            <Text style={paragraph}>
              {senderName} has sent you an invoice for <strong>{amount}</strong>
              , due on <strong>{dueDate}</strong>.
            </Text>

            {/* Invoice Summary Box */}
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
                <Text style={summaryLabel}>Due Date</Text>
                <Text style={summaryValue}>{dueDate}</Text>
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
};

const greeting = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#18181b",
  margin: "0 0 16px 0",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#52525b",
  margin: "0 0 24px 0",
};

const summaryBox = {
  backgroundColor: "#f4f4f5",
  padding: "20px",
  borderRadius: "8px",
  marginBottom: "24px",
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

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
  Hr,
} from "@react-email/components";

interface PaymentReceiptEmailProps {
  freelancerName: string;
  clientName: string;
  invoiceNumber: string;
  amount: string;
  paidAt: string;
}

export const PaymentReceiptEmail = ({
  freelancerName,
  clientName,
  invoiceNumber,
  amount,
  paidAt,
}: PaymentReceiptEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>You've been paid {amount}!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>Paidly</Text>
          </Section>

          {/* Body */}
          <Section style={content}>
            {/* Success Indicator */}
            <Text style={checkmark}>✅</Text>

            <Heading style={headline}>You've been paid!</Heading>

            <Text style={paragraph}>
              <strong>{clientName}</strong> paid <strong>{amount}</strong> for
              invoice <strong>{invoiceNumber}</strong>.
            </Text>

            {/* Details Box */}
            <Section style={detailsBox}>
              <Text style={amountDisplay}>{amount}</Text>
              <Text style={detailsRow}>
                <Text style={detailsLabel}>Invoice</Text>
                <Text style={detailsValue}>{invoiceNumber}</Text>
              </Text>
              <Text style={detailsRow}>
                <Text style={detailsLabel}>Paid By</Text>
                <Text style={detailsValue}>{clientName}</Text>
              </Text>
              <Text style={detailsRow}>
                <Text style={detailsLabel}>Paid On</Text>
                <Text style={detailsValue}>{paidAt}</Text>
              </Text>
            </Section>

            <Text style={successMessage}>
              The payment has been recorded in your Paidly dashboard. You can
              view all your earnings and download reports anytime.
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

const checkmark = {
  fontSize: "48px",
  margin: "0 0 16px 0",
};

const headline = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#18181b",
  margin: "0 0 16px 0",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#52525b",
  margin: "0 0 24px 0",
};

const detailsBox = {
  backgroundColor: "#f4f4f5",
  padding: "24px",
  borderRadius: "8px",
  marginBottom: "24px",
};

const amountDisplay = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#10b981",
  margin: "0 0 20px 0",
};

const detailsRow = {
  margin: "0 0 12px 0",
  display: "flex",
  justifyContent: "space-between",
  textAlign: "left" as const,
};

const detailsLabel = {
  fontSize: "14px",
  color: "#71717a",
  margin: "0",
};

const detailsValue = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#18181b",
  margin: "0",
};

const successMessage = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#71717a",
  margin: "0",
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

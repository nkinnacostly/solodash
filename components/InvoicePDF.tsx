import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

// Currency symbol mapping
const getCurrencySymbol = (code: string): string => {
  const map: Record<string, string> = {
    USD: "$",
    GBP: "\u00A3", // £
    EUR: "\u20AC", // €
    NGN: "NGN ", // Naira — no unicode support in default PDF font
    GHS: "GHS ", // Cedi
    KES: "KES ", // Shilling
    ZAR: "R", // Rand
  };
  return map[code] || code + " ";
};

// Helper to convert hex to rgb string for PDF colors
const hexToPdfColor = (hex: string): string => {
  return hex; // @react-pdf/renderer accepts hex colors directly
};

const createStyles = (brandColor: string) =>
  StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: "Helvetica",
      fontSize: 10,
      color: "#18181b",
      backgroundColor: "#ffffff",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    companySection: {
      flex: 1,
    },
    logo: {
      maxWidth: 150,
      maxHeight: 50,
      marginBottom: 4,
    },
    companyName: {
      fontSize: 24,
      fontWeight: "bold",
      color: hexToPdfColor(brandColor),
      marginBottom: 4,
    },
    freelancerName: {
      fontSize: 11,
      color: "#52525b",
      marginBottom: 2,
    },
    contactInfo: {
      fontSize: 9,
      color: "#71717a",
    },
    invoiceSection: {
      flex: 1,
      alignItems: "flex-end",
    },
    invoiceLabel: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#a1a1aa",
      marginBottom: 4,
      letterSpacing: 2,
    },
    invoiceNumber: {
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: 4,
    },
    dateText: {
      fontSize: 9,
      color: "#52525b",
      marginBottom: 2,
    },
    divider: {
      borderBottomWidth: 2,
      borderBottomColor: hexToPdfColor(brandColor),
      marginBottom: 20,
    },
    billToSection: {
      marginBottom: 24,
    },
    billToLabel: {
      fontSize: 8,
      fontWeight: "bold",
      color: "#71717a",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 4,
    },
    clientName: {
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: 2,
    },
    clientEmail: {
      fontSize: 10,
      color: "#52525b",
      marginBottom: 2,
    },
    clientAddress: {
      fontSize: 10,
      color: "#52525b",
    },
    table: {
      marginBottom: 24,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#f4f4f5",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#e4e4e7",
    },
    headerText: {
      fontSize: 9,
      fontWeight: "bold",
      color: "#52525b",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#f4f4f5",
    },
    tableRowAlt: {
      flexDirection: "row",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#f4f4f5",
      backgroundColor: "#fafafa",
    },
    colDescription: {
      flex: 3,
      fontSize: 10,
    },
    colCenter: {
      flex: 1,
      fontSize: 10,
      textAlign: "center",
    },
    colRight: {
      flex: 1,
      fontSize: 10,
      textAlign: "right",
    },
    colRightBold: {
      flex: 1,
      fontSize: 10,
      fontWeight: "bold",
      textAlign: "right",
    },
    totalsSection: {
      alignItems: "flex-end",
      marginBottom: 24,
    },
    totalsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
      width: 280,
    },
    totalsLabel: {
      fontSize: 10,
      color: "#52525b",
    },
    totalsValue: {
      fontSize: 10,
    },
    totalsRowTotal: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 8,
      borderTopWidth: 2,
      borderTopColor: hexToPdfColor(brandColor),
      width: 280,
    },
    totalsLabelTotal: {
      fontSize: 12,
      fontWeight: "bold",
    },
    totalsValueTotal: {
      fontSize: 14,
      fontWeight: "bold",
      color: hexToPdfColor(brandColor),
    },
    notesSection: {
      marginTop: 24,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: "#e4e4e7",
    },
    notesLabel: {
      fontSize: 8,
      fontWeight: "bold",
      color: "#71717a",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 6,
    },
    notesText: {
      fontSize: 9,
      color: "#52525b",
      lineHeight: 1.5,
    },
    footer: {
      position: "absolute",
      bottom: 40,
      left: 40,
      right: 40,
      textAlign: "center",
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: "#e4e4e7",
    },
    footerText: {
      fontSize: 9,
      color: "#71717a",
      fontStyle: "italic",
    },
    watermark: {
      position: "absolute",
      top: 280,
      left: 120,
      opacity: 0.08,
      transform: "rotate(-20deg)",
    },
    watermarkImage: {
      width: 220,
      height: 220,
      objectFit: "contain" as const,
    },
    watermarkText: {
      fontSize: 48,
      fontWeight: "bold",
      color: hexToPdfColor(brandColor),
      textAlign: "center",
    },
  });

interface InvoicePDFProps {
  invoice: {
    invoice_number: string;
    issue_date: string;
    due_date: string;
    currency: string;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    notes: string | null;
    status: string;
  };
  client: {
    name: string;
    email: string;
    address: string | null;
  };
  profile: {
    name: string;
    business_name: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    logo_url: string | null;
    brand_color: string;
    plan: string;
  };
  lineItems: {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({
  invoice,
  client,
  profile,
  lineItems,
}) => {
  const currencySymbol = getCurrencySymbol(invoice.currency);
  const brandColor = profile.brand_color || "#10b981";
  const styles = createStyles(brandColor);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark — only for Pro users */}
        {profile.plan === "pro" && (
          <View style={styles.watermark}>
            {profile.logo_url ? (
              <Image style={styles.watermarkImage} src={profile.logo_url} />
            ) : (
              <Text style={styles.watermarkText}>
                {profile.business_name || "Paidly"}
              </Text>
            )}
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companySection}>
            {profile.logo_url ? (
              <Image style={styles.logo} src={profile.logo_url} />
            ) : (
              <Text style={styles.companyName}>
                {profile.business_name || profile.name || "Paidly"}
              </Text>
            )}
            <Text style={styles.freelancerName}>{profile.name}</Text>
            <Text style={styles.contactInfo}>{profile.email}</Text>
            {profile.phone && (
              <Text style={styles.contactInfo}>{profile.phone}</Text>
            )}
            {profile.address && (
              <Text style={styles.contactInfo}>{profile.address}</Text>
            )}
          </View>

          <View style={styles.invoiceSection}>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.dateText}>
              Issue Date: {formatDate(invoice.issue_date)}
            </Text>
            <Text style={styles.dateText}>
              Due Date: {formatDate(invoice.due_date)}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bill To */}
        <View style={styles.billToSection}>
          <Text style={styles.billToLabel}>Bill To</Text>
          <Text style={styles.clientName}>{client.name}</Text>
          <Text style={styles.clientEmail}>{client.email}</Text>
          {client.address && (
            <Text style={styles.clientAddress}>{client.address}</Text>
          )}
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.headerText, styles.colCenter]}>Qty</Text>
            <Text style={[styles.headerText, styles.colRight]}>Rate</Text>
            <Text style={[styles.headerText, styles.colRight]}>Amount</Text>
          </View>

          {lineItems.map((item, index) => (
            <View
              key={index}
              style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colCenter}>{item.quantity}</Text>
              <Text style={styles.colRight}>
                {currencySymbol}
                {Number(item.rate).toFixed(2)}
              </Text>
              <Text style={styles.colRightBold}>
                {currencySymbol}
                {Number(item.amount).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>
              {currencySymbol}
              {Number(invoice.subtotal).toFixed(2)}
            </Text>
          </View>

          {invoice.tax_rate > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax ({invoice.tax_rate}%)</Text>
              <Text style={styles.totalsValue}>
                {currencySymbol}
                {Number(invoice.tax_amount).toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.totalsRowTotal}>
            <Text style={styles.totalsLabelTotal}>Total</Text>
            <Text style={styles.totalsValueTotal}>
              {currencySymbol}
              {Number(invoice.total).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Payment due by {formatDate(invoice.due_date)}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

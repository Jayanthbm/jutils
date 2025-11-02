const fs = require("fs");
const { format } = require("date-fns");
const { parseISO, addMonths, isAfter, isEqual } = require("date-fns");
const ExcelJS = require("exceljs");

const LOAN_AMOUNT = 3500000.0;
const INTEREST_RATE = 10.5 / 100 / 12; // Monthly interest rate
const START_DATE = "2021-11-09";
const TENURE = 180; // Loan tenure in months

const SHEETS = {
  Base: [{ date: "2021-11-09", amount: 40000 }],
  Planned: [{ date: "2021-11-09", amount: 40000 }, { date: "2026-01-09", amount: 50000 }],
};

const EMI =
  (LOAN_AMOUNT * INTEREST_RATE * Math.pow(1 + INTEREST_RATE, TENURE)) /
  (Math.pow(1 + INTEREST_RATE, TENURE) - 1);

const TOTAL_INTEREST_ORIGINAL = EMI * TENURE - LOAN_AMOUNT;

let workbook = new ExcelJS.Workbook();

const formatSheet = (worksheet) => {
  worksheet.columns.forEach((column, index) => {
    switch (index) {
      case 0:
        column.width = 12;
        break;
      case 1:
        column.width = 11.2;
        break;
      case 2:
        column.width = 11.7;
        break;
      case 3:
        column.width = 11.5;
        break;
      case 4:
        column.width = 12.7;
        break;
      case 5:
        column.width = 9;
        break;
      case 6:
        column.width = 10.8;
        break;
      case 7:
        column.width = 10.9;
        column;
        break;
      case 8:
        column.width = 0.4;
        break;
      case 9:
      case 11:
        column.width = 13;
        break;
      case 10:
      case 12:
        column.width = 18;
        break;

      default:
    }
  });
  worksheet.getRow(1).font = { bold: true };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.mergeCells("J2:M2");
  worksheet.getCell("J2").font = { bold: true };
  worksheet.mergeCells("J3:K3");
  worksheet.getCell("J3").font = { bold: true };
  worksheet.mergeCells("L3:M3");
  worksheet.getCell("L3").font = { bold: true };
  worksheet.getCell("J2").alignment = {
    vertical: "middle",
    horizontal: "center",
  };
  worksheet.getCell("J3").alignment = {
    vertical: "middle",
    horizontal: "center",
  };
  worksheet.getCell("L3").alignment = {
    vertical: "middle",
    horizontal: "center",
  };
};

const formatYearsAndMonths = (months) => {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return `${years} year${years !== 1 ? "s" : ""}, ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""
    }`;
};

const getApplicablePayment = (date, payments) => {
  let applicableAmount = payments[0].amount;
  for (const payment of payments) {
    if (
      isAfter(date, parseISO(payment.date)) ||
      isEqual(date, parseISO(payment.date))
    ) {
      applicableAmount = payment.amount;
    }
  }
  return applicableAmount;
};

const addEmiSchedule = (worksheet, payments) => {
  let remainingAmount = LOAN_AMOUNT;
  let currentDate = parseISO(START_DATE);
  let totalInterestPaid = 0;
  let monthsTaken = 0;

  worksheet.addRow([
    "Month",
    "EMI Amount",
    "Amount Paid",
    "Interest Paid",
    "Principal Paid",
    "Extra Paid",
    "Remaining",
    "Months Left",
  ]);

  for (let i = TENURE; remainingAmount > 0; i--) {
    let interestPaid = remainingAmount * INTEREST_RATE;
    let principalPaid = EMI - interestPaid;
    let amountPaid = getApplicablePayment(currentDate, payments);
    let extraPaid = Math.max(amountPaid - EMI, 0);

    if (amountPaid > remainingAmount + interestPaid) {
      amountPaid = remainingAmount + interestPaid;
      extraPaid = amountPaid - EMI;
    }

    remainingAmount -= principalPaid + extraPaid;
    if (remainingAmount < 0) remainingAmount = 0;

    totalInterestPaid += interestPaid;
    monthsTaken++;

    worksheet.addRow([
      format(currentDate, "MMM-d-yyyy"),
      `₹${EMI.toFixed(2)}`,
      `₹${amountPaid.toFixed(2)}`,
      `₹${interestPaid.toFixed(2)}`,
      `₹${principalPaid.toFixed(2)}`,
      `₹${extraPaid.toFixed(2)}`,
      `₹${remainingAmount.toFixed(2)}`,
      i,
    ]);

    currentDate = addMonths(currentDate, 1);
  }

  // Add Summary in Right Section (Starting from Column "J")
  worksheet.getCell("J2").value = "Summary";
  worksheet.getCell("J3").value = "Original Plan";
  worksheet.getCell("J4").value = "Tenure";
  worksheet.getCell("K4").value = formatYearsAndMonths(TENURE);
  worksheet.getCell("J5").value = "Total Interest";
  worksheet.getCell("K5").value = `₹${TOTAL_INTEREST_ORIGINAL.toFixed(2)}`;
  worksheet.getCell("J6").value = "Closing Date";
  const originalClosingDate = addMonths(parseISO(START_DATE), TENURE);
  worksheet.getCell("K6").value = format(originalClosingDate, "MMM-d-yyyy");

  worksheet.getCell("L3").value = "New Plan";
  worksheet.getCell("L5").value = "Tenure";
  worksheet.getCell("M5").value = formatYearsAndMonths(monthsTaken);
  worksheet.getCell("L5").value = "Total Interest:";
  worksheet.getCell("M5").value = `₹${totalInterestPaid.toFixed(2)}`;
  worksheet.getCell("L6").value = "Closing Date";
  const newClosingDate = addMonths(parseISO(START_DATE), monthsTaken);
  worksheet.getCell("M6").value = format(newClosingDate, "MMM-d-yyyy");

  worksheet.getCell("J8").value = "Preclosed";
  worksheet.getCell("K8").value = formatYearsAndMonths(TENURE - monthsTaken);
  worksheet.getCell("J9").value = "Interest Saved";
  worksheet.getCell("K9").value = `₹${(
    TOTAL_INTEREST_ORIGINAL - totalInterestPaid
  ).toFixed(2)}`;

  formatSheet(worksheet);
};

// Generate sheets dynamically
Object.entries(SHEETS).forEach(([sheetName, payments]) => {
  let worksheet = workbook.addWorksheet(sheetName);
  addEmiSchedule(worksheet, payments);
});

const fileName = `emi_schedule.xlsx`;
workbook.xlsx.writeFile(fileName).then(() => {
  console.log(`Excel file generated: ${fileName}`);
});

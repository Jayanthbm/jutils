const fs = require("fs");
const faker = require("faker");
faker.locale = "en_IND"; // Set locale to India

let generatedMobiles = [];
let generatedEmails = [];

function generateMobile() {
  let mobile;
  do {
    mobile = faker.phone.phoneNumber();
    mobile = mobile.replace("+91", "");
    mobile = mobile.replaceAll("-", "");
  } while (generatedMobiles.includes(mobile));
  generatedMobiles.push(mobile);
  return mobile;
}

function generateEmail() {
  let email;
  do {
    email = faker.internet.email().toLowerCase();
  } while (generatedEmails.includes(email));
  generatedEmails.push(email);
  return email;
}

function createInsertStatement() {
  const mobile = generateMobile();
  const email = generateEmail();
  const first_name = faker.name.firstName();
  const last_name = faker.name.lastName();
  const dob = faker.date
    .between("1955-01-01", "2005-12-31")
    .toISOString()
    .split("T")[0]; // Date of birth between 1955 and 2005
  const sex = faker.random.arrayElement(["Male", "Female"]);
  const occupation = faker.name.jobTitle();
  const address = faker.address.streetAddress(true).replace(/\n/g, ", ");

  return `INSERT INTO 735638_patients (mobile, email, first_name, last_name, dob, sex, occupation, address) VALUES ('${mobile}', '${email}', '${first_name}', '${last_name}', '${dob}', '${sex}', '${occupation}', '${address}');\n`;
}

const number_of_records = 2000;
let sql_statements = "";

for (let i = 0; i < number_of_records; i++) {
  sql_statements += createInsertStatement();
}

fs.writeFileSync("insert_patients.sql", sql_statements);

console.log("Patients generated successfully!");

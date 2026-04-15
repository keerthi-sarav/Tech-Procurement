# SOGFusion Procurement Module — Plain-English Summary

> For anyone who needs to understand and explain this system confidently — no technical background required.

---

## 🧭 What Is This System?

**SOGFusion Procurement** is a web-based software that manages everything related to **buying materials and tracking assets** for a gas company.

Instead of using paper forms, WhatsApp messages, or Excel sheets to request materials, compare vendor prices, approve orders, or track cylinders — **everything is done in one place, digitally, with a full history**.

Think of it as a **digital purchase department** — from the moment someone says "we need something" to the moment the bill is paid and the goods are in the warehouse.

---

## 🖥️ How Do You Use It?

- Open a **web browser** and go to the app (runs on the company's computer/server)
- You see a **dark sidebar** on the left with all the modules
- Click any module → fill in the details → save
- Every entry is stored in the **database** — nothing is lost, everything is traceable

No installation needed for users — just a browser.

---

## 📦 What Does It Cover? (The 10 Modules)

The system follows the **natural flow of procurement** — from need to payment:

---

### 1. Purchase Requisition (PR)
> **"We need something"**

When any department (Production, Maintenance, Admin, etc.) needs to buy materials, they raise a **Purchase Requisition**. It records:
- Who raised it
- Which department
- What items are needed and how many
- When they need it by

This is the **starting point** of every purchase.

---

### 2. Request for Quotation (RFQ)
> **"Let's ask vendors for their price"**

Once a PR is approved, the purchase team contacts multiple vendors and asks for their best price. The system lets you:
- Select multiple vendors at once
- List the items you want quoted
- Set a deadline (validity date) for quotes

This replaces sending emails or making calls manually — it's all recorded in the system.

---

### 3. Vendor Quotation & Comparison
> **"Which vendor is cheapest / best?"**

When vendors send their price quotes, you enter them into the system. It then:
- Shows all vendor quotes **side by side**
- Automatically **highlights the lowest price in green**
- Lets you click one button to **select the best vendor**

No more comparing quotes in Excel — the system does it for you.

---

### 4. Purchase Order (PO)
> **"We are officially ordering from you"**

Once the best vendor is chosen, a **Purchase Order** is created — this is the official legal document that says "we are buying this from you at this price." It includes:
- Vendor details
- Items, quantities, rates
- Tax and discounts (calculated automatically)
- Total amount
- Delivery date and payment terms

The PO goes through an **approval process** — someone with authority can Approve or Reject it in the system.

---

### 5. Goods Receipt Note (GRN)
> **"We received the goods — here's what actually arrived"**

When the vendor delivers the goods, the warehouse team records a **GRN**. It tracks:
- What was ordered vs. what actually arrived
- How many items were rejected (damaged/wrong)
- How many were accepted (auto-calculated)
- Whether QC inspection is needed

This protects the company — you only pay for what you actually received in good condition.

---

### 6. Purchase Invoice
> **"The vendor sent a bill — let's record and pay it"**

When the vendor sends their tax invoice (bill), the accounts team records it here. The system:
- Automatically calculates GST on the subtotal
- Links the invoice to the GRN and PO for verification
- Tracks whether it's Unpaid, Partially Paid, or Paid
- One-click "Mark as Paid" button

This gives Finance a clear view of outstanding payables.

---

### 7. Cylinder Purchase
> **"We bought new cylinders — record it as an asset"**

Gas cylinders are **expensive fixed assets** (not consumables), so they are tracked separately. When the company buys new cylinders in bulk, this module records:
- Which vendor supplied them
- How many of each type (Oxygen, CO2, LPG, etc.)
- Cost per cylinder and total cost
- Invoice reference

---

### 8. Serial Number Entry
> **"Give every cylinder its own ID"**

Every individual cylinder gets a **unique serial number** (like a vehicle's registration plate). This module maintains a **digital register** of every cylinder the company owns, including:
- Its type, size, and capacity
- When it was manufactured
- When it's due for testing
- Current status: Active / In Testing / Scrapped

The summary cards at the top always show a live count of Active, In Testing, and Scrapped cylinders.

---

### 9. Send for Testing
> **"These cylinders need hydro testing — sending them out"**

By law, gas cylinders must be **pressure tested (hydro tested) every 5 years** and repaired if damaged. When cylinders are sent to an external testing agency, this module records:
- Which agency they were sent to
- Which serial numbers went out
- Why (Hydro Testing, Valve Repair, etc.)
- Expected return date

This ensures the company always knows which cylinders are out for testing and when to expect them back.

---

### 10. Return from Vendor
> **"Cylinders are back — here are the results"**

When the testing agency returns the cylinders, this module records:
- Which cylinders passed (safe to use)
- Which cylinders failed (must be scrapped)
- Next test due date for passed cylinders
- Any repair costs

**The magic:** When you save this, the system **automatically updates the cylinder register** — passed cylinders go back to "Active", failed cylinders are marked "Scrapped". No manual updates needed.

---

## 🔗 How Everything Connects

```
PR → RFQ → Vendor Quotes → PO → GRN → Invoice → ✅ Done

Cylinder Bought → Serial Entered → Sent for Testing → Returned → Status Auto-Updated
```

Every step is **linked** — a PO knows which RFQ it came from, a GRN knows which PO it's receiving for, an invoice knows which GRN it's billing for. This gives a complete **audit trail** for every purchase.

---

## 🛡️ Key Benefits

| Problem Before | How the System Solves It |
|---|---|
| PRs raised on paper / WhatsApp | Digital form with department, date, items — fully searchable |
| Comparing vendor quotes in Excel | Auto comparison table — lowest price highlighted automatically |
| Not knowing PO approval status | Approve/Reject buttons with status visible to everyone |
| Manual counting of received goods | GRN auto-calculates accepted = received − rejected |
| GST calculation errors on invoices | Tax amount calculated automatically from subtotal + % |
| No idea how many cylinders we own | Live registry with serial numbers, statuses, test dates |
| Forgetting which cylinders are at testing agency | Testing log with agency name, cylinders sent, expected return |
| Manually updating cylinder status after testing | System auto-updates when you record the return results |

---

## ❓ Common Questions & Answers

**Q: Where is the data stored?**
> In a **MySQL database** running on the same computer as the server. All entries are saved permanently.

**Q: Can multiple people use it at the same time?**
> Yes. It's a web application — multiple team members can have it open in their browser simultaneously.

**Q: What happens if I accidentally delete a record?**
> It's permanently deleted from the database. There's currently no recycle bin — so users should confirm before deleting.

**Q: Do different departments need separate logins?**
> Currently, the system has a single Admin user. User login management (who can do what) can be added as a future enhancement.

**Q: Can I export data to Excel or PDF?**
> Not in the current version — this is a future enhancement that can be added.

**Q: Is purchase data connected to the Production module?**
> They run on separate databases right now — `procurement_db` for Procurement, and the Production module's own DB. They can be integrated in a future phase.

**Q: What if the internet goes down?**
> This system runs **locally on your company network** — it doesn't need the internet to work. As long as the server computer is on, everyone on the same network can access it.

**Q: How many vendors/items can it hold?**
> No practical limit — MySQL can handle millions of records.

**Q: Can we add more cylinder types or departments?**
> Yes — these are dropdown lists that can be updated in the code in minutes.

---

## 🚀 In One Sentence

> SOGFusion Procurement is a digital system that manages the entire buying process — from someone requesting materials, to comparing vendor prices, placing an order, receiving goods, paying bills, and tracking every gas cylinder the company owns — all in one place, with a full history.

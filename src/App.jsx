import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import FirmProvider from "@/lib/firm/FirmProvider";
import ExpensesProvider from "@/lib/expenses/ExpensesProvider";
import SuppliersProvider from "@/lib/suppliers/SuppliersProvider";
import ClientsProvider from "@/lib/clients/ClientsProvider";

// Root Pages
import Dashboard from "@/pages/Dashboard";
import References from "@/pages/References";
import Reports from "@/pages/Reports";

// Profile Module
import ProfileInfo from "@/pages/profile/ProfileInfo";
import Tasks from "@/pages/profile/Tasks";

// Clients Module
import ClientsList from "@/pages/clients/ClientsList";
import ClientDetails from "@/pages/clients/ClientDetails";

// Company Settings
import LawFirmProfile from "@/pages/firm/LawFirmProfile";
import BankEdit from "@/pages/firm/BankEdit";
import ChangePassword from "@/pages/settings/ChangePassword";
import SignIn from "@/pages/settings/SignIn";

// Expenses
import ExpensesPage from "@/pages/expenses/ExpensesPage";
import ExpenseForm from "@/pages/expenses/ExpenseForm";
import GeneralInvoices from "@/pages/expenses/GeneralInvoices";
import CourtFeePayments from "@/pages/expenses/CourtFeePayments";
import JudicialExpenseForm from "@/pages/expenses/JudicialExpenseForm";
import CourtFeeDetails from "@/pages/expenses/CourtFeeDetails";
import NewInvoice from "@/pages/expenses/NewInvoice";

// Suppliers
import SuppliersPage from "@/pages/suppliers/SuppliersPage";
import SupplierForm from "@/pages/suppliers/SupplierForm";

// Corporate Module
import CorporateList from "@/pages/corporate/CorporateList";

// Employees Module
import EmployeesList from "@/pages/employees/EmployeesList";
import EmployeeForm from "@/pages/employees/EmployeeForm";
import EmployeeView from "@/pages/employees/EmployeeView";

// Finance Module
import InvoicesList from "@/pages/finance/InvoicesList";

// Litigation Module
import LitigationList from "@/pages/litigation/LitigationList";
import Registration from "@/pages/litigation/Registration";
import CourtHearing from "@/pages/litigation/CourtHearing";
import PostJudgement from "@/pages/litigation/PostJudgement";
import Execution from "@/pages/litigation/Execution";

function App() {
  return (
    <FirmProvider>
      <ExpensesProvider>
        <SuppliersProvider>
          <ClientsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              {/* Default redirect to dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* Company Settings */}
              <Route path="settings/firm" element={<LawFirmProfile />} />
              <Route path="settings/bank/:id" element={<BankEdit />} />
              <Route path="settings/password" element={<ChangePassword />} />
              <Route path="sign-in" element={<SignIn />} />

              {/* Expenses */}
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="suppliers/create" element={<SupplierForm />} />
              <Route path="suppliers/:id" element={<SupplierForm />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="expenses/create" element={<ExpenseForm />} />
              <Route path="expense-requests" element={<GeneralInvoices />} />
              <Route
                path="partner-disbursements"
                element={<GeneralInvoices partnersOnly />}
              />
              <Route
                path="court-fee-payments"
                element={<CourtFeePayments />}
              />
              <Route
                path="court-fee-payments/create"
                element={<JudicialExpenseForm />}
              />
              {/* Kept below /create so the literal path wins over the id */}
              <Route
                path="court-fee-payments/:id"
                element={<CourtFeeDetails />}
              />
              <Route
                path="expense-requests/create"
                element={<NewInvoice />}
              />

              {/* Root Pages */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="references" element={<References />} />
              <Route path="reports" element={<Reports />} />

              {/* Profile Module */}
              <Route path="profile" element={<ProfileInfo />} />
              <Route path="profile/tasks" element={<Tasks />} />

              {/* Clients Module */}
              <Route path="clients" element={<ClientsList />} />
              <Route path="clients/create" element={<ClientDetails />} />
              <Route path="clients/:id" element={<ClientDetails />} />

              {/* Corporate Module */}
              <Route path="corporate" element={<CorporateList />} />

              {/* Employees Module */}
              <Route path="employees" element={<EmployeesList />} />
              <Route path="employees/create" element={<EmployeeForm />} />
              <Route path="employees/:id" element={<EmployeeView />} />
              <Route path="employees/:id/edit" element={<EmployeeForm />} />

              {/* Finance Module */}
              <Route path="finance" element={<InvoicesList />} />

              {/* Litigation Module */}
              <Route path="litigation" element={<LitigationList />} />
              <Route path="litigation/register" element={<Registration />} />
              <Route path="litigation/:id/hearing" element={<CourtHearing />} />
              <Route
                path="litigation/:id/judgement"
                element={<PostJudgement />}
              />
              <Route path="litigation/:id/execution" element={<Execution />} />

              {/* Archive - placeholder */}
              <Route path="archive" element={<Dashboard />} />
            </Route>
          </Routes>
        </BrowserRouter>
          </ClientsProvider>
        </SuppliersProvider>
      </ExpensesProvider>
    </FirmProvider>
  );
}

export default App;

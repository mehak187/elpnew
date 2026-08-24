import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, ArrowLeft, Edit, Mail, Phone, Calendar, Building, Briefcase, GraduationCap, DollarSign, Globe, Languages } from "lucide-react";
import { Rial } from "@/components/shared/Rial";

// Mock employee data - in real app, this would come from API
const employees = [
  { id: 1, emp_id: "1", name: "Mohammed Al Yahyaei", arabicName: "محمد اليحيائي", branch: "Muscat", dateOfJoining: "2020-01-15", dateOfBirth: "1985-03-20", gender: "Male", nationality: "Oman", department: "Partner", designation: "Partner", salary: "2500.000", status: "Active", phone: "+968 9123 4567", email: "mohammed@elp.com", languageOfCommunication: "Both", educationalLevel: "Master's Degree", nationalIdentityExpire: "2028-03-20" },
  { id: 2, emp_id: "2", name: "Fatima Al Rashdi", arabicName: "فاطمة الراشدي", branch: "Muscat", dateOfJoining: "2021-03-20", dateOfBirth: "1990-07-15", gender: "Female", nationality: "Oman", department: "Lawyer", designation: "Litigation", salary: "2000.000", status: "Active", phone: "+968 9234 5678", email: "fatima@elp.com", languageOfCommunication: "Arabic", educationalLevel: "Bachelor's Degree", nationalIdentityExpire: "2027-07-15" },
  { id: 3, emp_id: "3", name: "Ahmed Al Balushi", arabicName: "أحمد البلوشي", branch: "Salalah", dateOfJoining: "2022-06-10", dateOfBirth: "1988-11-25", gender: "Male", nationality: "Oman", department: "Lawyer", designation: "Supervisor", salary: "800.000", status: "On Leave", phone: "+968 9345 6789", email: "ahmed@elp.com", languageOfCommunication: "Both", educationalLevel: "Bachelor's Degree", nationalIdentityExpire: "2026-11-25" },
  { id: 4, emp_id: "4", name: "Sarah Al Lawati", arabicName: "سارة اللواتي", branch: "Muscat", dateOfJoining: "2019-09-05", dateOfBirth: "1992-04-10", gender: "Female", nationality: "Oman", department: "Administrative", designation: "Administrative", salary: "650.000", status: "Active", phone: "+968 9456 7890", email: "sarah@elp.com", languageOfCommunication: "English", educationalLevel: "Secondary Education", nationalIdentityExpire: "2029-04-10" },
  { id: 5, emp_id: "5", name: "Rajesh Kumar", arabicName: "", branch: "Salalah", dateOfJoining: "2023-02-28", dateOfBirth: "1987-09-08", gender: "Male", nationality: "India", department: "Accountant", designation: "Accountant", salary: "1200.000", status: "Inactive", phone: "+968 9567 8901", email: "rajesh@elp.com", languageOfCommunication: "English", educationalLevel: "Bachelor's Degree", nationalIdentityExpire: "2025-09-08", passportExpire: "2028-05-15", visaExpire: "2025-02-28", lawyerCardExpire: "2025-12-31" },
];

export default function EmployeeView() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Find employee by id
  const employee = employees.find(emp => emp.id === parseInt(id)) || employees[0];

  const getStatusVariant = (status) => {
    const variants = {
      "Active": "success",
      "Inactive": "secondary",
      "On Leave": "warning",
      "Terminated": "destructive"
    };
    return variants[status] || "default";
  };

  const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value || "-"}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/employees")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="p-2 sm:p-3 rounded-xl bg-secondary">
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">
              Employee Details
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              View employee information
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(`/employees/${id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Employee
        </Button>
      </div>

      {/* Employee Profile Card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
            {/* Photo */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-muted flex items-center justify-center border-4 border-primary/20">
              <User className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
            </div>
            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl sm:text-2xl font-bold">{employee.name}</h2>
                <Badge variant={getStatusVariant(employee.status)}>{employee.status}</Badge>
              </div>
              {employee.arabicName && (
                <p className="text-lg text-muted-foreground mb-2" dir="rtl">{employee.arabicName}</p>
              )}
              <p className="text-sm text-muted-foreground">Employee No: {employee.emp_id}</p>
              <p className="text-sm text-muted-foreground">{employee.designation} - {employee.department}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
            <InfoItem icon={Mail} label="Email" value={employee.email} />
            <InfoItem icon={Phone} label="Phone" value={employee.phone} />
            <InfoItem icon={Calendar} label="Date of Birth" value={employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('en-GB') : "-"} />
            <InfoItem icon={User} label="Gender" value={employee.gender} />
            <InfoItem icon={Globe} label="Nationality" value={employee.nationality} />
            <InfoItem icon={Languages} label="Language" value={employee.languageOfCommunication} />
            <InfoItem icon={Building} label="Branch" value={employee.branch} />
            <InfoItem icon={Calendar} label="Date of Joining" value={employee.dateOfJoining ? new Date(employee.dateOfJoining).toLocaleDateString('en-GB') : "-"} />
            <InfoItem icon={GraduationCap} label="Education Level" value={employee.educationalLevel} />
            <InfoItem icon={Briefcase} label="Department" value={employee.department} />
            <InfoItem icon={Briefcase} label="Designation" value={employee.designation} />
            <InfoItem icon={DollarSign} label="Salary" value={<>{parseFloat(employee.salary).toFixed(3)} <Rial /></>} />
          </div>

          {/* Document Expiry Section */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Document Expiry Dates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoItem
                icon={Calendar}
                label="National Identity Expire"
                value={employee.nationalIdentityExpire ? new Date(employee.nationalIdentityExpire).toLocaleDateString('en-GB') : "-"}
              />
              {employee.nationality !== "Oman" && (
                <>
                  <InfoItem
                    icon={Calendar}
                    label="Passport Expire"
                    value={employee.passportExpire ? new Date(employee.passportExpire).toLocaleDateString('en-GB') : "-"}
                  />
                  <InfoItem
                    icon={Calendar}
                    label="Visa Expire"
                    value={employee.visaExpire ? new Date(employee.visaExpire).toLocaleDateString('en-GB') : "-"}
                  />
                  <InfoItem
                    icon={Calendar}
                    label="Lawyer Card Expire"
                    value={employee.lawyerCardExpire ? new Date(employee.lawyerCardExpire).toLocaleDateString('en-GB') : "-"}
                  />
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

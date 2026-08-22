import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, UserCog, Save, ArrowLeft, Upload, X, User } from "lucide-react";

// Mock employee data - in real app, this would come from API
const employeesData = [
  { id: 1, emp_id: "1", name: "Mohammed Al Yahyaei", arabicName: "محمد اليحيائي", branch: "Muscat", dateOfJoining: "2020-01-15", dateOfBirth: "1985-03-20", gender: "Male", nationality: "Oman", department: "Partner", designation: "Partner", salary: "2500.000", status: "Active", phone: "+968 9123 4567", email: "mohammed@elp.com", languageOfCommunication: "Both", educationalLevel: "Master's Degree", nationalIdentityExpire: "2028-03-20" },
  { id: 2, emp_id: "2", name: "Fatima Al Rashdi", arabicName: "فاطمة الراشدي", branch: "Muscat", dateOfJoining: "2021-03-20", dateOfBirth: "1990-07-15", gender: "Female", nationality: "Oman", department: "Lawyer", designation: "Litigation", salary: "2000.000", status: "Active", phone: "+968 9234 5678", email: "fatima@elp.com", languageOfCommunication: "Arabic", educationalLevel: "Bachelor's Degree", nationalIdentityExpire: "2027-07-15" },
  { id: 3, emp_id: "3", name: "Ahmed Al Balushi", arabicName: "أحمد البلوشي", branch: "Salalah", dateOfJoining: "2022-06-10", dateOfBirth: "1988-11-25", gender: "Male", nationality: "Oman", department: "Lawyer", designation: "Supervisor", salary: "800.000", status: "On Leave", phone: "+968 9345 6789", email: "ahmed@elp.com", languageOfCommunication: "Both", educationalLevel: "Bachelor's Degree", nationalIdentityExpire: "2026-11-25" },
  { id: 4, emp_id: "4", name: "Sarah Al Lawati", arabicName: "سارة اللواتي", branch: "Muscat", dateOfJoining: "2019-09-05", dateOfBirth: "1992-04-10", gender: "Female", nationality: "Oman", department: "Administrative", designation: "Administrative", salary: "650.000", status: "Active", phone: "+968 9456 7890", email: "sarah@elp.com", languageOfCommunication: "English", educationalLevel: "Secondary Education", nationalIdentityExpire: "2029-04-10" },
  { id: 5, emp_id: "5", name: "Rajesh Kumar", arabicName: "", branch: "Salalah", dateOfJoining: "2023-02-28", dateOfBirth: "1987-09-08", gender: "Male", nationality: "India", department: "Accountant", designation: "Accountant", salary: "1200.000", status: "Inactive", phone: "+968 9567 8901", email: "rajesh@elp.com", languageOfCommunication: "English", educationalLevel: "Bachelor's Degree", nationalIdentityExpire: "2025-09-08", passportExpire: "2028-05-15", visaExpire: "2025-02-28", lawyerCardExpire: "2025-12-31" },
];

const emptyFormData = {
  nationality: "",
  arabicName: "",
  employeeName: "",
  gender: "",
  dateOfBirth: "",
  phone: "",
  email: "",
  languageOfCommunication: "",
  dateOfJoining: "",
  branch: "",
  educationalLevel: "",
  department: "",
  jobDesignation: "",
  salary: "",
  status: "",
  nationalIdentityExpire: "",
  passportExpire: "",
  visaExpire: "",
  lawyerCardExpire: "",
};

export default function EmployeeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formData, setFormData] = useState(emptyFormData);

  // Load employee data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const employee = employeesData.find(emp => emp.id === parseInt(id));
      if (employee) {
        setFormData({
          nationality: employee.nationality || "",
          arabicName: employee.arabicName || "",
          employeeName: employee.name || "",
          gender: employee.gender || "",
          dateOfBirth: employee.dateOfBirth || "",
          phone: employee.phone || "",
          email: employee.email || "",
          languageOfCommunication: employee.languageOfCommunication || "",
          dateOfJoining: employee.dateOfJoining || "",
          branch: employee.branch || "",
          educationalLevel: employee.educationalLevel || "",
          department: employee.department || "",
          jobDesignation: employee.designation || "",
          salary: employee.salary || "",
          status: employee.status || "",
          nationalIdentityExpire: employee.nationalIdentityExpire || "",
          passportExpire: employee.passportExpire || "",
          visaExpire: employee.visaExpire || "",
          lawyerCardExpire: employee.lawyerCardExpire || "",
        });
      }
    }
  }, [id, isEditMode]);

  const isOmani = formData.nationality === "Oman";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const employeeData = {
      ...formData,
      photo: photoFile?.name,
    };
    if (isEditMode) {
      console.log("Updating employee:", employeeData);
    } else {
      console.log("Creating employee:", employeeData);
    }
    navigate("/employees");
  };

  const HeaderIcon = isEditMode ? UserCog : UserPlus;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/employees")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="p-2 sm:p-3 rounded-xl bg-secondary">
            <HeaderIcon className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">
              {isEditMode ? "Edit Employee" : "Add New Employee"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isEditMode ? "Update employee information" : "Create a new employee record"}
            </p>
          </div>
        </div>
        <Button type="submit" form="employee-form">
          <Save className="mr-2 h-4 w-4" />
          {isEditMode ? "Update Employee" : "Save Employee"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <form id="employee-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload Section */}
            <div className="space-y-2">
              <Label>Employee Photo</Label>
              <div className="flex items-start gap-6">
                <div className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-lg overflow-hidden flex items-center justify-center bg-muted">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Employee preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Photo
                      </span>
                    </Button>
                  </label>
                  {photoFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removePhoto}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Nationality */}
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality *</Label>
                <Select
                  value={formData.nationality}
                  onValueChange={(value) => handleSelectChange("nationality", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oman">Oman</SelectItem>
                    <SelectItem value="UAE">UAE</SelectItem>
                    <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                    <SelectItem value="Kuwait">Kuwait</SelectItem>
                    <SelectItem value="Bahrain">Bahrain</SelectItem>
                    <SelectItem value="Qatar">Qatar</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="Pakistan">Pakistan</SelectItem>
                    <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                    <SelectItem value="Philippines">Philippines</SelectItem>
                    <SelectItem value="Egypt">Egypt</SelectItem>
                    <SelectItem value="Jordan">Jordan</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Arabic Name */}
              <div className="space-y-2">
                <Label htmlFor="arabicName">Employee Name in Arabic</Label>
                <Input
                  id="arabicName"
                  name="arabicName"
                  value={formData.arabicName}
                  onChange={handleChange}
                  placeholder="أدخل الاسم بالعربية"
                  dir="rtl"
                  className="text-right"
                />
              </div>

              {/* Employee Name (English) */}
              <div className="space-y-2">
                <Label htmlFor="employeeName">Employee Name *</Label>
                <Input
                  id="employeeName"
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleChange}
                  placeholder="Enter employee name"
                  required
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleSelectChange("gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+968 XXXX XXXX"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  required
                />
              </div>

              {/* Language of Communication */}
              <div className="space-y-2">
                <Label htmlFor="languageOfCommunication">Language of Communication *</Label>
                <Select
                  value={formData.languageOfCommunication}
                  onValueChange={(value) => handleSelectChange("languageOfCommunication", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arabic">Arabic</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Both">Both (Arabic & English)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date of Joining */}
              <div className="space-y-2">
                <Label htmlFor="dateOfJoining">Date of Joining *</Label>
                <Input
                  id="dateOfJoining"
                  name="dateOfJoining"
                  type="date"
                  value={formData.dateOfJoining}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Branch */}
              <div className="space-y-2">
                <Label htmlFor="branch">Branch *</Label>
                <Select
                  value={formData.branch}
                  onValueChange={(value) => handleSelectChange("branch", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Muscat">Muscat</SelectItem>
                    <SelectItem value="Salalah">Salalah</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Educational Level */}
              <div className="space-y-2">
                <Label htmlFor="educationalLevel">Educational Level *</Label>
                <Select
                  value={formData.educationalLevel}
                  onValueChange={(value) => handleSelectChange("educationalLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primary Education">Primary Education</SelectItem>
                    <SelectItem value="Intermediate Education">Intermediate Education</SelectItem>
                    <SelectItem value="Secondary Education">Secondary Education</SelectItem>
                    <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                    <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                    <SelectItem value="Doctoral Degree (PHD)">Doctoral Degree (PHD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleSelectChange("department", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Partner">Partner</SelectItem>
                    <SelectItem value="Advisor">Advisor</SelectItem>
                    <SelectItem value="Lawyer">Lawyer</SelectItem>
                    <SelectItem value="Administrative">Administrative</SelectItem>
                    <SelectItem value="Accountant">Accountant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Job Designation */}
              <div className="space-y-2">
                <Label htmlFor="jobDesignation">Job Designation *</Label>
                <Select
                  value={formData.jobDesignation}
                  onValueChange={(value) => handleSelectChange("jobDesignation", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Partner">Partner</SelectItem>
                    <SelectItem value="Advisor">Advisor</SelectItem>
                    <SelectItem value="Litigation">Litigation</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    <SelectItem value="Accountant">Accountant</SelectItem>
                    <SelectItem value="Administrative">Administrative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Salary */}
              <div className="space-y-2">
                <Label htmlFor="salary">Salary (OMR) *</Label>
                <Input
                  id="salary"
                  name="salary"
                  type="number"
                  min="0"
                  step="0.001"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="Enter salary amount"
                  required
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* National Identity Expire */}
              <div className="space-y-2">
                <Label htmlFor="nationalIdentityExpire">National Identity Expire *</Label>
                <Input
                  id="nationalIdentityExpire"
                  name="nationalIdentityExpire"
                  type="date"
                  value={formData.nationalIdentityExpire}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Additional fields for non-Omani employees */}
              {formData.nationality && !isOmani && (
                <>
                  {/* Passport Expire */}
                  <div className="space-y-2">
                    <Label htmlFor="passportExpire">Passport Expire *</Label>
                    <Input
                      id="passportExpire"
                      name="passportExpire"
                      type="date"
                      value={formData.passportExpire}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Visa Expire */}
                  <div className="space-y-2">
                    <Label htmlFor="visaExpire">Visa Expire *</Label>
                    <Input
                      id="visaExpire"
                      name="visaExpire"
                      type="date"
                      value={formData.visaExpire}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Lawyer Card Expire */}
                  <div className="space-y-2">
                    <Label htmlFor="lawyerCardExpire">Lawyer Card Expire *</Label>
                    <Input
                      id="lawyerCardExpire"
                      name="lawyerCardExpire"
                      type="date"
                      value={formData.lawyerCardExpire}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

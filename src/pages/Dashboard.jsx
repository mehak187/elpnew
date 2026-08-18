import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  Scale,
  Briefcase,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const stats = [
  { title: "Active Cases", value: "24", change: "+3 this month", icon: Scale, color: "text-blue-600" },
  { title: "Total Clients", value: "156", change: "+12 this month", icon: Users, color: "text-emerald-600" },
  { title: "Corporate Matters", value: "18", change: "+5 this month", icon: Briefcase, color: "text-purple-600" },
  { title: "Pending Invoices", value: "OMR 45,200", change: "8 invoices", icon: Wallet, color: "text-amber-600" },
];

const recentCases = [
  { case_no: "2024/001", client: "ABC Holdings LLC", type: "Civil", status: "Court Hearing" },
  { case_no: "2024/002", client: "XYZ Investments", type: "Commercial", status: "Registration" },
  { case_no: "2024/003", client: "Ali Mohammed", type: "Labor", status: "Post Judgement" },
  { case_no: "2024/004", client: "Global Trade Co", type: "Civil", status: "Execution" },
];

const upcomingTasks = [
  { task: "Prepare documents for case 2024/001", due: "Tomorrow", priority: "High" },
  { task: "Client meeting - ABC Holdings", due: "Dec 18", priority: "Medium" },
  { task: "Submit appeal documents", due: "Dec 20", priority: "High" },
  { task: "Review contract for Tech Ventures", due: "Dec 22", priority: "Low" },
];

export default function Dashboard() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 sm:p-3 rounded-xl bg-secondary">
          <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Welcome back, Mohammed Al Yahyaei
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-secondary ${stat.color}`}>
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Cases */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Scale className="h-4 w-4 text-secondary-foreground" />
              Recent Cases
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {recentCases.map((item) => (
                <div
                  key={item.case_no}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{item.case_no}</p>
                    <p className="text-xs text-muted-foreground">{item.client}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant="outline" className="text-xs">{item.type}</Badge>
                    <p className="text-xs">
                      <Badge
                        variant={
                          item.status === "Registration"
                            ? "secondary"
                            : item.status === "Court Hearing"
                            ? "brand"
                            : item.status === "Post Judgement"
                            ? "warning"
                            : "default"
                        }
                        className="text-xs"
                      >
                        {item.status}
                      </Badge>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Clock className="h-4 w-4 text-secondary-foreground" />
              Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-3">
              {upcomingTasks.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {item.priority === "High" ? (
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    ) : item.priority === "Medium" ? (
                      <Clock className="h-4 w-4 text-amber-500 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{item.task}</p>
                      <p className="text-xs text-muted-foreground">Due: {item.due}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      item.priority === "High"
                        ? "destructive"
                        : item.priority === "Medium"
                        ? "warning"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {item.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Cases Won</p>
            <p className="text-2xl font-bold text-emerald-600">18</p>
            <p className="text-xs text-muted-foreground">This Year</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Cases Lost</p>
            <p className="text-2xl font-bold text-red-600">3</p>
            <p className="text-xs text-muted-foreground">This Year</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-amber-600">24</p>
            <p className="text-xs text-muted-foreground">Active Cases</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Success Rate</p>
            <p className="text-2xl font-bold text-primary">86%</p>
            <p className="text-xs text-muted-foreground">This Year</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

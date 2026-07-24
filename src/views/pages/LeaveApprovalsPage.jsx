import { Navigate } from "react-router-dom";

/** Legacy route — HR / team lead use the unified Leave Requests page. */
function LeaveApprovalsPage() {
  return <Navigate to="/leave-requests" replace />;
}

export default LeaveApprovalsPage;

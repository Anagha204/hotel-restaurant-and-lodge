import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            
            const res = await axios.post(`${API_URL}/auth/login`, { email, password });
            const { token, user } = res.data;
            login(token, user);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card shadow-lg p-4" style={{ width: "400px" }}>
                <div className="text-center mb-4">
                    <h2 className="text-danger">🏨 Login</h2>
                    <p className="text-muted">Access the management dashboard</p>
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label>Email</label>
                        <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                    </div>
                    <div className="mb-3">
                        <label>Password</label>
                        <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-danger w-100" disabled={loading}>
                        {/* {loading ? "Signing in..." : "Sign in as Admin"} */}Login
                    </button>
                </form>
            </div>
        </div>
    );
}

// import { useState } from "react";
// import { useAuth } from "../context/AuthContext";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";

// const API_URL = "http://localhost:5000/api";

// export default function AdminLogin() {
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [error, setError] = useState("");
//     const [loading, setLoading] = useState(false);
//     const { login } = useAuth();
//     const navigate = useNavigate();

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setError("");
//         setLoading(true);
//         try {
//             const res = await axios.post(`${API_URL}/auth/login`, { email, password });
//             const { token, user } = res.data;
//             login(token, user);
//             navigate("/");
//         } catch (err) {
//             setError(err.response?.data?.message || "Invalid credentials");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="container d-flex justify-content-center align-items-center vh-100">
//             <div className="card shadow-lg p-4" style={{ width: "400px" }}>
//                 <h2 className="text-center text-danger">🏨 Login</h2>
//                 <p className="text-center text-muted">Access your dashboard</p>
//                 {error && <div className="alert alert-danger">{error}</div>}
//                 <form onSubmit={handleSubmit}>
//                     <div className="mb-3">
//                         <label>Email</label>
//                         <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
//                     </div>
//                     <div className="mb-3">
//                         <label>Password</label>
//                         <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
//                     </div>
//                     <button type="submit" className="btn btn-danger w-100" disabled={loading}>
//                         {loading ? "Logging in..." : "Login"}
//                     </button>
//                 </form>
//             </div>
//         </div>
//     );
// }
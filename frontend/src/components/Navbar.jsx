import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Navbar() {

    const {

        user,

        logout

    } = useAuth();

    const handleLogout = async () => {

        await logout();

        window.location.href = "/";

    };

    return (

        <nav

            className="navbar navbar-expand-lg bg-white shadow-sm px-4"

        >

            <span className="navbar-brand fw-bold">

                SpendWise

            </span>

            <div className="ms-auto dropdown">

                <button

                    className="btn btn-light dropdown-toggle"

                    data-bs-toggle="dropdown"

                >

                    <i className="bi bi-person-circle me-2"></i>

                    {user?.fullname}

                </button>

                <ul className="dropdown-menu dropdown-menu-end">

                    <li>

                        <Link

                            className="dropdown-item"

                            to="/profile"

                        >

                            Profile

                        </Link>

                    </li>

                    <li>

                        <Link

                            className="dropdown-item"

                            to="/security"

                        >

                            Security

                        </Link>

                    </li>

                    <li>

                        <hr className="dropdown-divider"/>

                    </li>

                    <li>

                        <button

                            className="dropdown-item text-danger"

                            onClick={handleLogout}

                        >

                            Logout

                        </button>

                    </li>

                </ul>

            </div>

        </nav>

    );

}

export default Navbar;
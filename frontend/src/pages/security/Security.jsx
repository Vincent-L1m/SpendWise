import DashboardLayout from "../../layouts/DashboardLayout";

function Security() {

    return (

        <DashboardLayout>

            <div className="card shadow-sm">

                <div className="card-body">

                    <h3>

                        Security

                    </h3>

                    <hr />

                    <div className="d-grid gap-3">

                        <button className="btn btn-primary">

                            Create PIN

                        </button>

                        <button className="btn btn-success">

                            Verify PIN

                        </button>

                        <button className="btn btn-warning">

                            Change PIN

                        </button>

                        <button className="btn btn-dark">

                            Enable / Disable Biometric

                        </button>

                    </div>

                </div>

            </div>

        </DashboardLayout>

    );

}

export default Security;
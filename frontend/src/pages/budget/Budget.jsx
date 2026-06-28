import DashboardLayout from "../../layouts/DashboardLayout";

function Budget() {

    return (

        <DashboardLayout>

            <div className="card shadow-sm">

                <div className="card-body">

                    <div className="d-flex justify-content-between">

                        <h3>

                            Budget

                        </h3>

                        <button className="btn btn-success">

                            +

                            Create Budget

                        </button>

                    </div>

                    <hr />

                    <p className="text-muted">

                        Belum ada budget.

                    </p>

                </div>

            </div>

        </DashboardLayout>

    );

}

export default Budget;
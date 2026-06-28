import DashboardLayout from "../../layouts/DashboardLayout";

function Transaction() {

    return (

        <DashboardLayout>

            <div className="card shadow-sm">

                <div className="card-body">

                    <div className="d-flex justify-content-between">

                        <h3>

                            Transaction

                        </h3>

                        <button className="btn btn-primary">

                            +

                            Add Transaction

                        </button>

                    </div>

                    <hr />

                    <p className="text-muted">

                        Belum ada transaksi.

                    </p>

                </div>

            </div>

        </DashboardLayout>

    );

}

export default Transaction;
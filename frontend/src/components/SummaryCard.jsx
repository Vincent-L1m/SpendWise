function SummaryCard({

    title,

    amount,

    icon,

    color

}) {

    return (

        <div className="card shadow-sm border-0">

            <div className="card-body">

                <div className="d-flex justify-content-between align-items-center">

                    <div>

                        <small className="text-muted">

                            {title}

                        </small>

                        <h3 className="fw-bold mt-2">

                            {amount}

                        </h3>

                    </div>

                    <div>

                        <i

                            className={`bi ${icon} ${color}`}

                            style={{

                                fontSize:"40px"

                            }}

                        ></i>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default SummaryCard;
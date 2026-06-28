function Card({

    children,

    className = ""

}) {

    return (

        <div

            className={`card shadow-sm border-0 ${className}`}

        >

            <div className="card-body">

                {children}

            </div>

        </div>

    );

}

export default Card;
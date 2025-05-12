import "./Button.scss"

const Button = ({
                    text,
                    type,
                    variant = 'primary',
                    size = 'md',
                    disabled = false,
                    icon = null,
                    className = '',
                    onClick,
                }) => {
    const classes = `btn ${variant} ${size} ${className}`;
    return (
        <button
            type={type}
            className={classes}
            onClick={onClick}
            disabled={disabled}
        >
            {icon && <span className='btn-icon'>{icon}</span>}
            {text}
        </button>
    )
}


export default Button;

//@flow
import React from 'react';

type IconType = {
    className: string,
    onClick: Function
};

const IconOk = (props: IconType) => {
    return (
        <svg
            width="14px"
            height="14px"
            viewBox="0 0 24 24"
            version="1.1"
            className={props.className}
            onClick={props.onClick}
        >
            <defs>
                <path d="M12,3 C16.9705627,3 21,7.02943725 21,12 C21,16.9705627 16.9705627,21 12,21 C7.02943725,21 3,16.9705627 3,12 C3,7.02943725 7.02943725,3 12,3 Z M14.2928932,9.29289322 L11,12.5857864 L9.70710678,11.2928932 C9.31658249,10.9023689 8.68341751,10.9023689 8.29289322,11.2928932 C7.90236893,11.6834175 7.90236893,12.3165825 8.29289322,12.7071068 L10.2928932,14.7071068 C10.6834175,15.0976311 11.3165825,15.0976311 11.7071068,14.7071068 L15.7071068,10.7071068 C16.0976311,10.3165825 16.0976311,9.68341751 15.7071068,9.29289322 C15.3165825,8.90236893 14.6834175,8.90236893 14.2928932,9.29289322 Z" id="path-check"></path>
            </defs>
            <g id="Icons-/-Interface-/-Check-in-circle" stroke="none" strokeWidth="1">
                <mask id="mask-check">
                    <use xlinkHref="#path-check"></use>
                </mask>
                <use id="Combined-Shape" xlinkHref="#path-check"></use>
            </g>
        </svg>
    );
};

export default IconOk;
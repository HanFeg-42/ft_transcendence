import logo from '../../assets/icons/PACOVA-logo.png';
import { useState } from 'react';
import {link} from 'react-router-dom';

export const nono = "NONO is sleeping"

// export default function nouss(): {}

// interface testprops {
//     value? : string;
// }

// const Test = ({value} : testprops)=>{
//     return (
//     <div>comment aller vous !!!!
//         <h1>{value}</h1>
//     </div>)
// };

// export default Test;


interface NavProps{
    color : string;
    font : string;
}

export default function NavBar({ color, font} : NavProps){
    const [isOpen, setOpen] = useState(false);
    return (
            <div className="relative z-50 flex items-center justify-between border-pacova-green border-b-2 w-full px-8 py-4 bg-pacova-surface/80 shadow-[0_2px_8px_rgba(142,214,3,0.5)] backdrop-blur-md shadow-md">
            <div className="flex items-center">
                {/* <Link to="/home"> */}
                    <img className="h-8 w-8 [image-rendering:pixelated]" src={logo} alt="logo pacova" />
                {/* </Link> */}
                <h1 className={`ml-3 font-press-start font-${color} text-xl drop-shadow-glow-pink tracking-wider`}>
                PACOVA
                </h1>
            </div>
            {/* ... la suite des liens ... */}
            <div className={`hidden md:flex font-${font} font-xl text-gray-500 md:space-x-20`}>
                <h1 className="cursor-pointer hover:text-white transition-colors">HOME</h1>
                <h1 className="cursor-pointer hover:text-white transition-colors">PROFILE</h1>
                <h1 className="cursor-pointer hover:text-white transition-colors">FREINDS</h1>
                <h1 className="cursor-pointer hover:text-white transition-colors">SETTING</h1>
            </div>
                <button 
                    className="block md:hidden font-bold" 
                    onClick={()=>{setOpen(!isOpen)}}
                    >
                    {isOpen? "FERMER": "MENU"}
                </button>
                {isOpen && (
                    <div className="absolute top-20 right w-full flex flex-col space-y-1 pt-4 pb-2 md:hidden">
                        <h1 className='cursor-pointer'>HOME</h1>
                        <h1 className='cursor-pointer'>PROFILE</h1>
                        <h1 className='cursor-pointer'>FREINDS</h1>
                        <h1 className='cursor-pointer'>SETTING</h1>
                    </div>
                )}
        </div>
    )
}
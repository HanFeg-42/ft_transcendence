import logo from '../../assets/icons/PACOVA-logo.png';
import { useState } from 'react';
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
        <div className={`flex items-center px-20 justify-between w-full h-3 p-8 shadow-md bg-${color} ${font}`}>
            <div className="flex items-center space-x-0">
                <img className="h-8 w-11" src={logo} alt="logo"></img>
                <h1 className={`p-10 font-${font} font-bold font-xl tracking-wider text-white`}>PACOVA</h1>
            </div>
            <div className={`hidden md:flex font-${font} items-center font-xl text-gray-500 md:space-x-20`}>
                <h1 className="cursor-pointer hover:text-white transition-colors">HOME</h1>
                <h1 className="cursor-pointer hover:text-white transition-colors">PROFILE</h1>
                <h1 className="cursor-pointer hover:text-white transition-colors">FREINDS</h1>
                <h1 className="cursor-pointer hover:text-white transition-colors">SETTING</h1>
            </div>
            <div className=''>
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
        </div>
    )
}
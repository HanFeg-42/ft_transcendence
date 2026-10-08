import logo from '../assets/icons/start-3d.png';

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

export default function NavBar({color, font} : NavProps){
    return (
        <div className="w-full h-3 p-10 bg-pink-500 ">
            <div className="bg-red ">
                <img className="logo" src={logo} alt=""></img>
                <h1>PACOVA</h1>
            </div>
            <div className="">
                <h1>HOME</h1>
                <h1>PROFILE</h1>
                <h1>FREINDS</h1>
                <h1>SETTING</h1>
            </div>
        </div>
    )
}
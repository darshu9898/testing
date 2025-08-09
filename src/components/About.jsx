import Image from 'next/image'
import React from 'react'

const About = () => {
  return (
    <>
        <div className=' ml-20 mt-7 text-2xl font-bold text-black'>
            About Trivedam
        </div>
        <div style={{ position: "relative", width: "400px", height: "400px",marginLeft: 30  }}>
            <Image 
                alt="img"
                src={"/combo.jpg"}
                fill
                />
            </div>
    
    </>
  )
}

export default About
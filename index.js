import { EC2Client, DescribeInstancesCommand,CreateImageCommand,DeregisterImageCommand,DescribeImagesCommand } from "@aws-sdk/client-ec2";
import { config } from "process";
let client = new EC2Client(config)


const date = new Date();

let currentDay= String(date.getDate()).padStart(2, '0');

let currentMonth = String(date.getMonth()+1).padStart(2,"0");

let currentYear = date.getFullYear();

let currentDate = `${currentDay}/${currentMonth}/${currentYear}`

let responseCode = 200
let command;
let data
let count=0

let ami_info =new Map()

let Instance_ids=[]
let Image_ids =[]

let deleted_Amis=[]
let image_Count=0
let running_Images={}



function dateConversion(str){
    let arr=str.split("-")
        
        
        
    let yr= arr[0]
    let mt=arr[1]
    let dy= arr[2][0]+arr[2][1]


    return mt+"/"+dy+"/"+yr

}


export const handler = async (event,_,callback) => {
  
  if(event.start_up === true){
    
    
//     command = new DescribeImagesCommand({ // DescribeInstancesRequest
//   Filters: [ // FilterList
//     { // Filter
//       Name: "tag:server-name",
//       Values: [ // ValueStringList
//         "server-*",
//       ],
//     },
    
//   ],

// })

// try{
//   data = await client.send(command)
  
//   image_Count= data.Images.length
  

  
  
  
// }catch(error){
//   return error
// }


 command = new DescribeInstancesCommand({ // DescribeInstancesRequest
  Filters: [ // FilterList
    { // Filter
      Name: "instance-state-name",
      Values: [ // ValueStringList
        "running",
      ],
    },
  ],
  // DryRun: true || false,
  // MaxResults: Number("int"),
  // NextToken: "STRING_VALUE",
})

 try{
   data = await client.send(command)
 }
 catch(error){
   return error
 }


    
    
   
      
      
    for(let info of data.Reservations){
      let instance= info.Instances
      for(let i=0;i<instance.length;i++){
        Instance_ids.push(instance[i].InstanceId)
      }
    }
    
    
    

    
    for(let k=0;k<Instance_ids.length;k++){
      const id = Instance_ids[k]
      const idx=k
      
    
      
      let input = {
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/sdh",
            "Ebs": {
              "VolumeSize": "100"
            }
          },
          {
            "DeviceName": "/dev/sdc",
            "VirtualName": "ephemeral1"
          }
        ],
        "Description": "An AMI for server"+"-"+`${idx+1}`,
        "InstanceId":id,
        "Name": "server"+"-"+`${idx+1}`+"-"+currentDate,
        "NoReboot": true,
        "TagSpecifications": [
          { ResourceType:"image",
            "Tags": [
              
              {
                Key:"server-name",
                Value: "dev"
              }
              
              
              ]
          }]
      }
      
      command =new CreateImageCommand(input)
      
      try{
        
        data = await client.send(command)
        
        ami_info[data.ImageId]= currentDate
        
      }catch(error){
        
        throw Error(error)
        
      }
      
    }
    
    
    
    //Next step how to find unused ami
     
     
     //First get all the Instances and get all the AMIs
     
     
     
     
    command = new DescribeInstancesCommand({ // DescribeInstancesRequest
  Filters: [ // FilterList
    { // Filter
      Name: "instance-state-name",
      Values: [ // ValueStringList
        "running",
      ],
    },
  ],
  // DryRun: true || false,
  // MaxResults: Number("int"),
  // NextToken: "STRING_VALUE",
})
     
     
    data =await client.send(command)
    

     
    
     
    for(let info of data.Reservations){
      let instance= info.Instances
      
      for(let i=0;i<instance.length;i++){
        
        //return instance[i].ImageId
        
        running_Images[instance[i].ImageId]=i //use map here and move forward
      }
      
      
    }
    
    //return running_Images
    
    
    
    
    command =new DescribeImagesCommand({
      Owners:["AWS_ID"]
    })
    
    data = await client.send(command)
    
    let images= data.Images
    
    images.forEach((imageInfo,index)=>{
      Image_ids.push([imageInfo.ImageId,imageInfo.CreationDate])
    })
    
    //return Image_ids
    
    
    
    
    
      for (let image_Id of Image_ids){
        
        
        if(running_Images[image_Id[0]]) continue;
        
        
        
        
        let image_date= image_Id[1].toString();
        let date_now = new Date();
        let now_utc = new Date(date_now.getTime() - date_now.getTimezoneOffset() * 60000).toISOString()
        
        
        console.log(image_date,now_utc)
        
        
        
        
        
        
        
        
        
        let date1=dateConversion(image_date);
        
        
        let date2= dateConversion(now_utc);
        
        let d1=new Date(date1);
        let d2=new Date(date2);
        
        
        console.log(d1,d2)
        
       
        
        
        
        let diffDays = Math.abs(d2.getTime()-d1.getTime());
        
        
        
      
      
      if (diffDays>30){
        
        
        
        const command = new DeregisterImageCommand({ImageId:image_Id[0]});
        
        try{
          const response = await client.send(command);
          deleted_Amis.push(image_Id[0])
          
        }
        catch(error){
          throw Error(error)
        }
        
        
        
      }
      
    }
    
    
    
    
    
    
    

 }
  
}
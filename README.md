# AWS-AMI-BACKUP

This is a personal project complete a challenge on : https://devopsrealtime.com/deploy-lambda-function-to-create-weekly-ec2-ami-backup/ 



## Objective
- Create an AWS Lambda function that backs-ups Amazon Machine Images of EC2 INSTANCES
- Deletes or Deregister AMIs that are not in use for over 30 days.
- Challenge request for Python, but i used Javascript for this problem.


## Steps:
1) Break down Nodejs/ Javascript code for both creation and deregistering of AMIs
2) Create Lambda Function
3) Create Event schedule trigger for lambda function
4) Create SNS Topic,Subscription,Cloud watch metric rules

## Lambda-function Node js Code

1) Import AWS SDK APIs and declare variables that will be used later in the async functions

```
// DescribeInstancesCommand: To determine all ec2 instances in the current region
// CreateImageCommand - Create images
// DeregisterImageCommand - Deregister images


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
let data;
let ami_info =new Map()
let Instance_ids=[]
let Image_ids =[]
let deleted_Amis=[]

```

2) Develop the async functions that will be triggered by an event.

   ```
   {start_up:true}
   ```


   ```
   async/await API call that creates a JSON document of all EC2 instances in the current AWS- REGION

   command = new DescribeInstancesCommand({})

   try{
     data = await client.send(command)
   }
   catch(error){
     return error
   }


     The next step run a for loop through the JSON document to get all the instance ID
    
     for(let info of data.Reservations){
          let instance= info.Instances
          for(let i=0;i<instance.length;i++){
            Instance_ids.push(instance[i].InstanceId)
          }
        }


   ```


  3) Create Images for all instance Ids collected in the step 2

      ```
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
            
            ami_info[data.ImageId]= currentDate    //Saving the AMI in a Map or Object for easy access
            
          }catch(error){
            
            throw Error(error)   //Note this error is to ensure that users are notified when there is an issue
            
          }
      
         }
      ```


      4) Final stage is to determine AMI not in use and over 30 days since it was created
    
         ```

         //Get all instances and collect the Image Ids with the current state: //running pending stopped etc
                  command = new DescribeInstancesCommand({})
                   
                   
                  data =await client.send(command)
                   
                  
                   
                  for(let info of data.Reservations){
                    let instance= info.Instances
                    
                    for(let i=0;i<instance.length;i++){
                      Image_ids.push([instance[i].ImageId,instance[i].State.Name])
                    }
                    
                    
                  }



              // if the image ID IS 
                  
                  
                  
                  
                  
                    for (let image_Id of Image_ids){
                      if(ami_info.get(image_Id[0])=== undefined) continue
                      
                      
                      
                      
                      
                      
                      
                      
                    
                    let date_Created = new Date(ami_info.get(image_Id[0]))
                    let date_now = new Date(currentDate)
                    const diffTime = Math.abs(date_Created - date_now);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    
                    if (diffDays>30 && (image_Id[1]!=="running") ){
                      
                      
                      
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

         
         ```





   


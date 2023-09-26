# AWS-AMI-BACKUP

This is a personal project complete a challenge on : https://devopsrealtime.com/deploy-lambda-function-to-create-weekly-ec2-ami-backup/ 



## Objective
- Create an AWS Lambda function that backs-ups Amazon Machine Images of EC2 INSTANCES
- Deletes or Deregister AMIs that are not in use for over 30 days.
- Challenge request for Python, but i used Javascript for this problem.
- Make use of AWS Javascript SDK to implement the AWS Lambda function



<img width="651" alt="image" src="https://github.com/leoimewore/AWS-AMI-BACKUP/assets/95531716/2a4f67dd-7595-46f5-b2a7-ef4b1b0ab43e">



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
                     Owners:[""]
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

         
         ```


   5) Create an SNS Topic to get a notification and subscription
      ![Screen Shot 2023-09-25 at 10 19 59 PM](https://github.com/leoimewore/AWS-AMI-BACKUP/assets/95531716/05cbd9fd-06cf-47e1-a4b0-2fef3e2ae7fe)


   6)Go to Cloudwatch and log groups 
      ![Screen Shot 2023-09-25 at 10 39 22 PM](https://github.com/leoimewore/AWS-AMI-BACKUP/assets/95531716/20fd2740-74b7-47f8-8125-870c7a439e12)

   7) Click on Create Metric Filter
      ```
      Filter Pattern: ERROR
      Filter Name: BACKUP-AMI-NOTIFICATION-ERROR
      Metric namespace: error-notification-namespace
      Metric name: error-notification
      Metric value:error-notification
      ```
      ![image](https://github.com/leoimewore/AWS-AMI-BACKUP/assets/95531716/a39a51c8-4e3e-41b4-8b6a-79a5bdc50b62)


 8) Check box the metric filter created and create a Cloud watch alarm
    Create an alarm where when a threshold of 1 error is met a notification is sent by the SNS.

    ![image](https://github.com/leoimewore/AWS-AMI-BACKUP/assets/95531716/d4e6ef17-cc5a-46a0-ad34-d425e01b5688)

    ![image](https://github.com/leoimewore/AWS-AMI-BACKUP/assets/95531716/09e007c1-6ccb-4363-b507-69a555542123)

    ![image](https://github.com/leoimewore/AWS-AMI-BACKUP/assets/95531716/98c7254a-56bf-47d2-8ae9-b0bc2141edce)



9) Finally we need to create and AmazonEventbridge schedules to trigger the backup lambda function every 7days

    ![image](https://github.com/leoimewore/AWS-AMI-BACKUP/assets/95531716/f614ab69-0935-4bcf-b4ea-cae17f11f730)

   Ensure to use a recurring schedule and Rate based schedule

   rate(7 days)

   Select start time and end time and dates
   ![image](https://github.com/leoimewore/AWS-AMI-BACKUP/assets/95531716/8be2de7e-b523-4748-976e-163b09c436fc)

   ![image](https://github.com/leoimewore/AWS-AMI-BACKUP/assets/95531716/45e98f0e-b946-4c80-adb1-3bec2c087cab)

   ![image](https://github.com/leoimewore/AWS-AMI-BACKUP/assets/95531716/7163d680-c221-459c-921c-44095c701a2d)
   ![image](https://github.com/leoimewore/AWS-AMI-BACKUP/assets/95531716/d99702ea-cdea-4e50-b78f-60ce150624f1)

   Add the pay load and the lambda function

   ![image](https://github.com/leoimewore/AWS-AMI-BACKUP/assets/95531716/5692aeba-8f43-45a7-af26-bf0e3bc7c31f)


   Create and this is the end of the project. 








    




         



         



         


             






























         





   


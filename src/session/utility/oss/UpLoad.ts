import { ExternalInterface, BasicMessageTakeawayDataInterface, Trouble, SolveConstructor, NormalConstructor, FailConstructor, } from "../ExternalInterface";
import { Request, } from "express";
import { InjectionRouter, } from "../../../routes/RoutersManagement";
import * as multer from "multer";
import * as fs from "fs";
import * as Oss from "ali-oss";
import { Token, } from "../token";

/* eslint-disable @typescript-eslint/no-namespace */
declare global
{
    namespace Express
    {
        // eslint-disable-next-line @typescript-eslint/interface-name-prefix
        interface Request
        {
            fileaddress: string;
        }
    }
}

interface IUpLoadRequest
{
    token: string;
    id: string;
}

interface IUpLoadErrorMessage
{
    status: 0| 1;
    message: string;
}

interface IUpLoadMessage
{
    status: 0| 1;
    message: string;
}


export class UpLoad extends ExternalInterface<BasicMessageTakeawayDataInterface>
{
    private upLoad = multer({dest: this.dest} as multer.Options);
    private ossClient = new Oss({
        region: 'oss-cn-shanghai',
        accessKeyId: 'LTAI4Fu9GcYg6jUaaaGiEVtw',
        accessKeySecret: 'zOoza3m604xja430WqyBNaDDFURAfE',
        bucket: 'milk-01',
    })

    public constructor (private FileName: string = "avatar", private model: "single"| "none" = "single", private dest: string = "/upload", )
    {
        super();
        InjectionRouter({method: "post", route: this.dest, controller: this.upLoad[this.model](this.FileName)});
    }

    protected async Verify (request: Request): Promise<void>
    {
        const info =  request.body as IUpLoadRequest
        if(!(info.id && info.token))
        {
            return Promise.reject({ status: 0, message: "invail request body" } as IUpLoadErrorMessage );
        }

        // const singleToken = Token.make_token();
        // if (!singleToken.checkToken(info.token))
        // {
        //     return Promise.reject({ status: 0, message: "invail token" });
        // }
    }
    
    protected async Process (requset: Request): Promise<Trouble<BasicMessageTakeawayDataInterface>>
    {

        try
        {
            const fileBuffs = fs.readFileSync(requset.file.path);
            await this.ossClient.put(requset.file.originalname, fileBuffs);
            const outerLinkUrl = this.ossClient.signatureUrl(requset.file.originalname);
            requset.fileaddress = outerLinkUrl;
        }
        catch(e)
        {
            return FailConstructor("service is not available");
        }

        if(this.CanNext())
        {
            return NormalConstructor<IUpLoadMessage>("Next");
        }
        return SolveConstructor<IUpLoadMessage>({ status:1, message: "upload success", });
    }
}
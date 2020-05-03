import { ExternalInterface } from "../utility/ExternalInterface";
import { IBasicMessageCarryDataInterface, ITrouble, SolveConstructor, IBasicMessageInterface } from "../utility/BassMessage";
import { Request } from "express";
import { Signal } from "../utility/signal";
import { CognitionController } from "../../controller/CognitionController";
import { UserInfoController } from "../../controller/UserInfoController";
import { InjectionRouter } from "../../routes/RoutersManagement";

interface IOneWayFriendRelationship
{
    token: string;
    targetId: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asserts (val: any, msg?: string): asserts val is IOneWayFriendRelationship
{
    if(!(val.token && val.targetId))
    {
        throw SolveConstructor<IBasicMessageInterface>({status: 0, message: msg });
    }
}

class OneWayFriendRelationship extends ExternalInterface<IBasicMessageCarryDataInterface>
{
    private id;
    private cognitionController = new CognitionController();
    private userInfoController: UserInfoController = new UserInfoController();

    protected async Verify (request: Request): Promise<void>
    {
        asserts(request.body, "invail request header");
        const signal = Signal.Unique();
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        this.id = signal.IsAvailability(request.body.token)?.id;
        if(!this.id)
        {
            return Promise.reject({ status: 0, message: "invail token" });
        }
    }    
    protected async Process (request: Request): Promise<ITrouble<IBasicMessageCarryDataInterface>> 
    {
        const info = request.body as IOneWayFriendRelationship;
        const owner = await this.userInfoController.findUser(info.targetId);
        const beowner = await this.userInfoController.findUser(this.id);
        await this.cognitionController.insert(owner, beowner);
        return SolveConstructor<IBasicMessageCarryDataInterface>({ status: 0, message: "add Success" });
    }
}

InjectionRouter({ method: "post", route: "/OneWayFriendRelationship", controller: new OneWayFriendRelationship, });
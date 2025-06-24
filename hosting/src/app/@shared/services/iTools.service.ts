import { Injectable } from '@angular/core';
import { iTools } from '../../../assets/tools/iTools';
import { ProjectSettings } from '@assets/settings/company-settings';
import { environment } from '../../../environments/environment.prod';
import { Utilities } from '../utilities/utilities';

@Injectable({ providedIn: 'root' })
export class IToolsService {

  public instance: iTools;

  constructor() {
    
    this.initialize();
  }


  public auth() {
    return this.instance.auth();
  }

  public functions() {
    return this.instance.functions();
  }

  public database() {
    return this.instance.database();
  }

  public storage() {
    return this.instance.storage();
  }


  private initialize(){
    const instance = new iTools();

    const defaultLogin = {};
    defaultLogin[environment.loginSettings.email] = {
      email: environment.loginSettings.email,
      password: environment.loginSettings.password, 
      encrypted: false
    };

    const logins = (localStorage.getItem("itoolsAuthenticate") ? JSON.parse(localStorage.getItem("itoolsAuthenticate")) : defaultLogin);
    const loginInfo = logins[Object.values(Utilities.currentLoginData).length > 0 ? Utilities.currentLoginData.email || environment.loginSettings.email : environment.loginSettings.email];
    // console.log(logins,  Object.values(Utilities.currentLoginData).length > 0, Utilities.currentLoginData);

    instance.initializeApp({
      projectId: ProjectSettings.companyID(),
      // adminKey: "0asc4b5e78994q3ad90235",
      developerMode: false,
      email: loginInfo.email,
      password: loginInfo.password,
      encrypted: (!!loginInfo.encrypted)
    }).then((res)=>{

    }).catch((err) => {      
      console.log(err);
    });

    this.instance = instance;
  }

}
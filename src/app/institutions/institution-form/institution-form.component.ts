import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Country, Institution, InstitutionControllerServiceProxy, InstitutionType, ServiceProxy } from 'shared/service-proxies/service-proxies';
import decode from 'jwt-decode';

@Component({
  selector: 'app-institution-form',
  templateUrl: './institution-form.component.html',
  styleUrls: ['./institution-form.component.css']
})
export class InstitutionFormComponent implements OnInit {

  //selectedTypeList: string[] = [];
  selectedTypeList: Institution[] = [];



  institution: Institution = new Institution();

  country: Country = new Country();

  countryList: Country[] = [];
  oldCountryList: Country[] = [];

  listc: Country[] = [];//not assigned list

  editInstitutionId: number = 0;

  isNewInstitution: boolean = true;


  getSelectedApproach() {

  }

  @ViewChild('op') overlay: any;



  constructor(private serviceProxy: ServiceProxy, private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private institutionProxy: InstitutionControllerServiceProxy,
    private router: Router,
    private messageService: MessageService) { }

  async ngOnInit(): Promise<void> {

    const token = localStorage.getItem('access_token')!;
    const tokenPayload = decode<any>(token);
    console.log('tokenPayload=========', tokenPayload);
    let institutionId = tokenPayload.institutionId;

    this.serviceProxy
      .getManyBaseInstitutionTypeControllerInstitutionType(
        undefined,
        undefined,
        ['id||$eq||1'],
        undefined,
        ['name,ASC'],
        undefined,
        1000,
        0,
        0,
        0
      ).subscribe((res: any) => {
        this.selectedTypeList = res.data;
      });
    let countryFilter: string[] = [];
    // countryFilter.push('Country.IsSystemUse||$eq||' + 1);

    await this.serviceProxy
      .getManyBaseCountryControllerCountry(
        undefined,
        undefined,
        countryFilter,
        undefined,
        ["name,ASC"],
        undefined,
        1000,
        0,
        0,
        0
      ).subscribe((res: any) => {
        this.countryList = res.data;

        for (let i in this.countryList) {
          if (this.countryList[i].institution?.id == this.editInstitutionId && this.editInstitutionId > 0) {

            this.listc.push(this.countryList[i]);
          }
        }
      });


    //edit institute
    this.route.queryParams.subscribe((params) => {
      this.editInstitutionId = params['id'];

      if (this.editInstitutionId > 0) {
        this.isNewInstitution = false;

        this.institutionProxy.getInstitutionDetails(
          this.editInstitutionId

        ).subscribe((res) => {
          this.institution = res;
          this.oldCountryList =res.countries;
          this.listc = res.countries;

          for (let co in this.listc) {
            this.countryList.push(this.listc[co]);
          }
        });

      }
    })



  }

  async saveForm(formData: NgForm) {

    if (formData.valid) {
      if (this.isNewInstitution) {
        this.institution.countries = this.listc;
        this.serviceProxy
          .createOneBaseInstitutionControllerInstitution(this.institution)
          .subscribe(
            (res) => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail:
                  this.institution.name +
                  ' has saved successfully ',
                closable: true,
              });

            },

            (err) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error.',
                detail: 'Internal server error, please try again.',
                sticky: true,
              });
            }
          );


        console.log("PPPP", formData);


      } else {

        await this.oldCountryList.forEach(async (old) => {
          let ins= new Institution();
          let co =new Array();
          ins.countries=co;
          ins.type =new InstitutionType()

          old.institution = null;
          console.log(old)
          this.serviceProxy
            .updateOneBaseCountryControllerCountry(old.id, old)
            .subscribe((res) => {});
        });


        this.institution.countries = this.listc;
        this.serviceProxy
          .updateOneBaseInstitutionControllerInstitution(this.institution.id, this.institution)
          .subscribe(
            (res) => {
              console.log("PPPP111",);
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail:
                  this.institution.name +
                  ' is updated successfully ',
                closable: true,

              });

            },
            (err) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error.',
                detail: 'Internal server error, please try again.',
                sticky: true,
              });
            }
          );



      }
    }

  }

  onBackClick() {
    this.router.navigate(['/instituion']);
  }


  activateInstitution(instituion: Institution) {

    console.log('sta', this.institution.status)

    if (this.institution.status == 1) {

      let statusUpdate = 0;
      this.institution.status = statusUpdate;
    }
    else if (this.institution.status == 0) {
      let statusUpdate = 1;
      this.institution.status = statusUpdate;

    }

    console.log("ACC", this.institution.status)

    this.serviceProxy
      .updateOneBaseInstitutionControllerInstitution(this.institution.id, this.institution)
      .subscribe((res) => {
        console.log("PPPP111222");
        this.confirmationService.confirm({
          message: this.institution.status === 0 ? this.institution.name + ' is Activated' : this.institution.name + ' is Deactivated',
          header: 'Confirmation',
          //acceptIcon: 'icon-not-visible',
          rejectIcon: 'icon-not-visible',
          rejectVisible: false,
          acceptLabel: 'Ok',
          accept: () => {
            this.onBackClick();
          },

          reject: () => { },
        });
        // this.messageService.add({
        //   severity: 'success',
        //   summary: 'Success',
        //   detail:

        //     this.institution.status === 0 ? this.institution.name + ' is Activated' : this.institution.name + ' is Deactivated'
        //   ,
        //   closable: true,
        // });
      },
        (err) => {
          console.log('error............'),
            this.messageService.add({
              severity: 'error',
              summary: 'Error.',
              detail: 'Failed Deactiavted, please try again.',
              sticky: true,
            });
        }
      );

  }


}

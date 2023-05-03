import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { debounceTime, tap, switchMap, finalize, distinctUntilChanged, filter } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { json } from 'body-parser';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.css']
})

export class FormComponent {
  keyword:string | undefined;
  distance:number | undefined;
  category:string | undefined = 'Default';
  location:string | undefined;
  lat:string | undefined;
  lon:string | undefined;
  isAutoDetect:boolean = false;
  isLoading:boolean = true;
  eventsList:any = [];
  eventDetails:any;
  results: any;

  isSubmitted:boolean = false;
  isEventClicked:boolean = false;
  formControl = new FormControl();
  constructor(private http: HttpClient) { }


  clearForm() : void {
    this.keyword = ''
    this.category = 'Default'
    this.distance = undefined
    this.location = ''
    this.isAutoDetect = false;
    

  }

  submitForm(): void {
    //console.log(this.keyword + "_" + this.distance + "_" + this.category + "_" + this.location);
    this.isSubmitted = true;
    let response;
    if(this.keyword  && this.category && (this.location || this.isAutoDetect)) {
      if(!this.isAutoDetect) {
        response = this.http.get("https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyAQ1Sr3YpcHpzJx5SUY3v3CwYi-2-9jIYM&address=" + this.location).pipe(
          switchMap((responseData : any) => {
              let latLong = JSON.parse(JSON.stringify(responseData))?.results[0]?.geometry?.location;
              this.lat = String(latLong.lat);
              this.lon = String(latLong.lng); 
              return this.http.get('http://localhost:3000/eventSearch?keyword=' + this.keyword + "&distance=" + this.distance + "&category=" + this.category + "&lat=" + this.lat + "&lon=" + this.lon); 
          }
        )).subscribe((responseData1: any) => {
          let s =  JSON.parse(JSON.stringify(responseData1));
          console.log(s);
          this.eventsList = s?.events;
          return responseData1;
        });
        
        console.log(response);
        
      } else {
        response = this.getEvents();
      }
      
      console.log(this.eventsList);

    }
  }


  getEvents(): Object {
    let data = this.http.get('http://localhost:3000/eventSearch?keyword=' + this.keyword + "&distance=" + this.distance + "&category=" + this.category + "&lat=" + this.lat + "&lon=" + this.lon)
      .subscribe(response => {
        console.log(response);
          let s =  JSON.parse(JSON.stringify(response));
          console.log(s);
          this.eventsList = s?.events;
          return response;
      });
    return data;
  }


  getEventDetails(id:string): void {
    this.isSubmitted = false;
    this.isEventClicked = true;
    let data = this.http.get('http://localhost:3000/eventDetails?id='+id).subscribe(response => {
      this.eventDetails = JSON.parse(JSON.stringify(response));
      console.log(this.eventDetails);
    });
    
    console.log("Event id is:" + id);
  }

  callIPInfo(): void {
    this.location='';
    this.http.get('https://ipinfo.io/json?token=a4c8da67f70a31')
      .subscribe(responseData => {
      let latLong = JSON.parse(JSON.stringify(responseData)).loc;
      let split = latLong.split(",");
      this.lat = split[0];
      this.lon = split[1];
      //console.log(this.latLong);
      });

    //this.isAutoDetect = true;
    if(this.isAutoDetect) {
      this.isAutoDetect = false;
    } else {
      this.isAutoDetect = true;
    }
  
  }

  onSelected(event: MatAutocompleteSelectedEvent) :void{
    
    this.keyword = event.option.value;
    //console.log("event name is selected:"+event.option.value);
    //console.log("this keyword is selected:"+this.keyword);
  }

  onInputChange():void {
    if(this.keyword != undefined && this.keyword.trim().length === 0) {
      this.results = [];
      this.keyword = '';
    } else {
      this.ngOnInit();
    }
  }

  displayWith(value: any) {
    return value;
  }

  ngOnInit() {
    this.formControl.valueChanges
      .pipe(
        /*filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),*/
        distinctUntilChanged(),
        debounceTime(1000),
        tap(() => {
          this.isLoading = true;
        }),
        switchMap(value => this.http.get('http://localhost:3000/autoSuggest?keyword=' + value)
          .pipe(
            finalize(() => {
              this.isLoading = false
            }),
          )
        )
      )
      .subscribe((data: any) => {
        if (data['suggestions'] === undefined || this.keyword?.length === 0 || this.keyword === undefined) {
          this.results = [];
        } else {
          this.results = data['suggestions'];
        }
        //console.log(this.results);
      });
      
  }

  backButtonClicked():void {
    this.isEventClicked = false;
    this.isSubmitted = true;
  }
}

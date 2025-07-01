import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyDirectReportsComponent } from './my-direct-reports.component';

describe('MyDirectReportsComponent', () => {
  let component: MyDirectReportsComponent;
  let fixture: ComponentFixture<MyDirectReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyDirectReportsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyDirectReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

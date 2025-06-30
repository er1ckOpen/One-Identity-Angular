import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomOpenConsultComponent } from './custom-open-consult.component';

describe('CustomOpenConsultComponent', () => {
  let component: CustomOpenConsultComponent;
  let fixture: ComponentFixture<CustomOpenConsultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomOpenConsultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomOpenConsultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
